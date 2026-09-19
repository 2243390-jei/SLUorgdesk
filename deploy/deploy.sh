#!/usr/bin/env bash
# =============================================================================
# SLU OrgDesk - deploy both services to Google Cloud Run
#
# Creates (idempotently):
#   * the required APIs, Artifact Registry repository, and two Cloud Storage
#     buckets mounted into the containers for upload persistence
#   * three Secret Manager secrets (Atlas URI, session secret, internal token)
#   * the orgdesk-api Cloud Run service, then orgdesk-web wired to it
#
# Usage:
#   export MONGO_URI='mongodb+srv://user:pass@cluster.mongodb.net/...'
#   bash deploy/deploy.sh
#
# All settings are overridable via environment variables - see the defaults below.
#
# NOTE: this script creates billable GCP resources. Review it before running.
# =============================================================================
set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
# asia-southeast1 (Singapore) is the closest region to Baguio.
REGION="${REGION:-asia-southeast1}"
AR_REPO="${AR_REPO:-orgdesk}"
WEB_SERVICE="${WEB_SERVICE:-orgdesk-web}"
API_SERVICE="${API_SERVICE:-orgdesk-api}"
MONGO_DB="${MONGO_DB:-Web-Tech}"

# One instance is deliberate: PHP stores sessions in local files and the app
# writes to shared volumes. Scale out only after moving sessions to Memorystore
# and uploads to Cloud Storage (see deploy/README.md).
MAX_INSTANCES="${MAX_INSTANCES:-1}"

UPLOADS_BUCKET="${UPLOADS_BUCKET:-${PROJECT_ID}-orgdesk-uploads}"
LOGOS_BUCKET="${LOGOS_BUCKET:-${PROJECT_ID}-orgdesk-logos}"

SECRET_MONGO="orgdesk-mongo-uri"
SECRET_SESSION="orgdesk-session-secret"
SECRET_INTERNAL="orgdesk-internal-auth-token"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

TAG="${TAG:-$(git -C "${PROJECT_ROOT}" rev-parse --short HEAD 2>/dev/null || echo latest)}"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

# -----------------------------------------------------------------------------
# Preflight
# -----------------------------------------------------------------------------
command -v gcloud >/dev/null 2>&1 || die "gcloud CLI not found on PATH."

if [ -z "${PROJECT_ID}" ] || [ "${PROJECT_ID}" = "(unset)" ]; then
  die "No GCP project selected. Run: gcloud config set project <PROJECT_ID>"
fi

# Reuse the local .env for the Atlas URI if it is not already exported.
if [ -z "${MONGO_URI:-}" ] && [ -f "${PROJECT_ROOT}/.env" ]; then
  MONGO_URI="$(grep -E '^MONGO_URI=' "${PROJECT_ROOT}/.env" | head -n1 | cut -d= -f2- || true)"
  if [ -n "${MONGO_URI}" ]; then
    log "Using MONGO_URI from ${PROJECT_ROOT}/.env"
  fi
fi
[ -n "${MONGO_URI:-}" ] || die "MONGO_URI is not set. export MONGO_URI='mongodb+srv://...' and re-run."

REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}"
WEB_IMAGE="${REGISTRY}/orgdesk-web:${TAG}"
API_IMAGE="${REGISTRY}/orgdesk-api:${TAG}"

log "Project  : ${PROJECT_ID}"
log "Region   : ${REGION}"
log "Registry : ${REGISTRY}"
log "Tag      : ${TAG}"

# -----------------------------------------------------------------------------
# 1. APIs
# -----------------------------------------------------------------------------
log "Enabling required APIs (this can take a minute)"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com \
  --project "${PROJECT_ID}" --quiet

# -----------------------------------------------------------------------------
# 2. Artifact Registry
# -----------------------------------------------------------------------------
if ! gcloud artifacts repositories describe "${AR_REPO}" \
      --location "${REGION}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  log "Creating Artifact Registry repository ${AR_REPO}"
  gcloud artifacts repositories create "${AR_REPO}" \
    --repository-format=docker --location "${REGION}" \
    --project "${PROJECT_ID}" \
    --description "OrgDesk container images" --quiet
else
  log "Artifact Registry repository ${AR_REPO} already exists"
fi

# -----------------------------------------------------------------------------
# 3. Cloud Storage buckets (mounted into both containers at runtime)
#
#    Cloud Run's container filesystem is ephemeral, so the directories that the
#    PHP and Node code write to are backed by buckets. No application code
#    changes are required: the containers simply see a writable directory.
# -----------------------------------------------------------------------------
ensure_bucket() {
  local bucket="$1"
  if ! gcloud storage buckets describe "gs://${bucket}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
    log "Creating bucket gs://${bucket}"
    gcloud storage buckets create "gs://${bucket}" \
      --project "${PROJECT_ID}" \
      --location "${REGION}" \
      --uniform-bucket-level-access \
      --public-access-prevention --quiet
  else
    log "Bucket gs://${bucket} already exists"
  fi
}

ensure_bucket "${UPLOADS_BUCKET}"
ensure_bucket "${LOGOS_BUCKET}"

# -----------------------------------------------------------------------------
# 4. Secrets
# -----------------------------------------------------------------------------
ensure_secret() {
  local name="$1" value="$2" description="$3"
  if ! gcloud secrets describe "${name}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
    log "Creating secret ${name}"
    gcloud secrets create "${name}" \
      --project "${PROJECT_ID}" \
      --replication-policy=automatic \
      --labels=app=orgdesk \
      --quiet >/dev/null
    printf '%s' "${value}" | gcloud secrets versions add "${name}" \
      --project "${PROJECT_ID}" --data-file=- --quiet >/dev/null
  else
    log "Secret ${name} already exists (left untouched)"
    if [ -n "${description}" ]; then
      warn "${description}"
    fi
  fi
}

log "Provisioning secrets"
ensure_secret "${SECRET_MONGO}"    "${MONGO_URI}" \
  "To rotate the Atlas URI: printf '%s' \"\$MONGO_URI\" | gcloud secrets versions add ${SECRET_MONGO} --data-file=-"

# Generate ephemeral strong values for secrets that must not be guessable.
RANDOM_SESSION="$(openssl rand -hex 48 2>/dev/null || head -c 96 /dev/urandom | od -An -tx1 | tr -d ' \n')"
RANDOM_INTERNAL="$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n')"

ensure_secret "${SECRET_SESSION}"  "${RANDOM_SESSION}" \
  "SESSION_SECRET already exists; a new value would invalidate all current logins."
ensure_secret "${SECRET_INTERNAL}" "${RANDOM_INTERNAL}" \
  "INTERNAL_AUTH_TOKEN already exists and must match the one injected into the web service."

# The Cloud Run runtime identity must be able to read the secrets.
PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
log "Runtime service account: ${RUNTIME_SA}"

for secret in "${SECRET_MONGO}" "${SECRET_SESSION}" "${SECRET_INTERNAL}"; do
  gcloud secrets add-iam-policy-binding "${secret}" \
    --project "${PROJECT_ID}" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet >/dev/null
done
log "Granted secretmanager.secretAccessor"

# The same identity writes into the mounted buckets and reads the images.
for bucket in "${UPLOADS_BUCKET}" "${LOGOS_BUCKET}"; do
  gcloud storage buckets add-iam-policy-binding "gs://${bucket}" \
    --project "${PROJECT_ID}" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/storage.objectAdmin" --quiet >/dev/null
done
log "Granted storage.objectAdmin on both buckets"

# -----------------------------------------------------------------------------
# 5. Build and push both images (Cloud Build - no local Docker required)
# -----------------------------------------------------------------------------
log "Building images with Cloud Build"
gcloud builds submit "${PROJECT_ROOT}" \
  --project "${PROJECT_ID}" \
  --config "${SCRIPT_DIR}/cloudbuild.yaml" \
  --substitutions="_REGION=${REGION},_AR_REPO=${AR_REPO},_TAG=${TAG}" \
  --quiet

# -----------------------------------------------------------------------------
# 6. Deploy the API service first, so the web service can be pointed at its URL
# -----------------------------------------------------------------------------
log "Deploying ${API_SERVICE}"
gcloud run deploy "${API_SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --image "${API_IMAGE}" \
  --port 8080 \
  --memory 512Mi --cpu 1 \
  --min-instances 0 --max-instances "${MAX_INSTANCES}" \
  --execution-environment gen2 \
  --allow-unauthenticated \
  --timeout 300 \
  --add-volume "name=uploads,type=cloud-storage,bucket=${UPLOADS_BUCKET}" \
  --add-volume-mount "volume=uploads,mount-path=/app/uploads" \
  --add-volume "name=logos,type=cloud-storage,bucket=${LOGOS_BUCKET}" \
  --add-volume-mount "volume=logos,mount-path=/app/public/images/orgs" \
  --set-env-vars "NODE_ENV=production,MONGO_DB=${MONGO_DB},COOKIE_SECURE=true" \
  --set-secrets "MONGO_URI=${SECRET_MONGO}:latest,SESSION_SECRET=${SECRET_SESSION}:latest,INTERNAL_AUTH_TOKEN=${SECRET_INTERNAL}:latest" \
  --quiet

API_URL="$(gcloud run services describe "${API_SERVICE}" \
  --project "${PROJECT_ID}" --region "${REGION}" \
  --format='value(status.url)')"
log "API URL: ${API_URL}"

warn "The API service is publicly reachable by URL, but every /api/* and"
warn "/uploads/* request without the X-Internal-Auth secret is rejected with 403."
warn "Only /health and the static file fallback respond without it."

# -----------------------------------------------------------------------------
# 7. Deploy the web service, proxying /api/* to the API service
# -----------------------------------------------------------------------------
log "Deploying ${WEB_SERVICE}"
gcloud run deploy "${WEB_SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --image "${WEB_IMAGE}" \
  --port 8080 \
  --memory 1Gi --cpu 1 \
  --min-instances 0 --max-instances "${MAX_INSTANCES}" \
  --session-affinity \
  --execution-environment gen2 \
  --allow-unauthenticated \
  --timeout 300 \
  --add-volume "name=uploads,type=cloud-storage,bucket=${UPLOADS_BUCKET}" \
  --add-volume-mount "volume=uploads,mount-path=/var/www/html/uploads" \
  --add-volume "name=logos,type=cloud-storage,bucket=${LOGOS_BUCKET}" \
  --add-volume-mount "volume=logos,mount-path=/var/www/html/public/images/orgs" \
  --set-env-vars "NODE_API_URL=${API_URL},PHP_SESSION_COOKIE_SECURE=1,MONGO_DB=${MONGO_DB}" \
  --set-secrets "INTERNAL_AUTH_TOKEN=${SECRET_INTERNAL}:latest,MONGO_URI=${SECRET_MONGO}:latest" \
  --quiet

WEB_URL="$(gcloud run services describe "${WEB_SERVICE}" \
  --project "${PROJECT_ID}" --region "${REGION}" \
  --format='value(status.url)')"

# The API's CORS allow-list is only consulted for direct callers, but the web
# origin is added so that ad-hoc debugging against the API URL also works.
log "Registering the web origin with the API CORS allow-list"
gcloud run services update "${API_SERVICE}" \
  --project "${PROJECT_ID}" --region "${REGION}" \
  --update-env-vars "CORS_ORIGINS=${WEB_URL}" \
  --quiet

# -----------------------------------------------------------------------------
# Done
# -----------------------------------------------------------------------------
cat <<EOF

================================================================================
OrgDesk is deployed.

  Web (open this) : ${WEB_URL}
  API             : ${API_URL}
  Images          : ${WEB_IMAGE}
                    ${API_IMAGE}
  Uploads bucket  : gs://${UPLOADS_BUCKET}
  Logos bucket    : gs://${LOGOS_BUCKET}

Next steps:
  1. Allow Cloud Run egress in MongoDB Atlas -> Network Access
     (deploy/README.md explains why 0.0.0.0/0 is required here).
  2. Verify: open the web URL and log in.
  3. Check logs:
       gcloud run services logs read ${WEB_SERVICE} --region ${REGION}
       gcloud run services logs read ${API_SERVICE} --region ${REGION}
================================================================================
EOF

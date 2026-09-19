# Deploy the API service passing values via --flags-file, which keeps them out of
# argv so MSYS cannot rewrite /app/uploads into C:/Program Files/Git/app/uploads.
#
# Also protects --set-secrets, whose colon-separated values are the same shape of
# argument MSYS likes to reinterpret.

echo "=== does gcloud run deploy support --flags-file? ==="
gcloud run deploy --help 2>&1 | grep -m1 -- '--flags-file' || echo "  (not listed in help)"

cat > /tmp/orgdesk-api-flags.yaml <<'YAML'
--project: "stiers"
--region: "asia-southeast1"
--image: "asia-southeast1-docker.pkg.dev/stiers/orgdesk/orgdesk-api:dd2e7a9"
--port: "8080"
--memory: "512Mi"
--cpu: "1"
--min-instances: "0"
--max-instances: "1"
--execution-environment: "gen2"
--allow-unauthenticated: null
--timeout: "300"
--add-volume:
  - "name=uploads,type=cloud-storage,bucket=stiers-orgdesk-uploads"
  - "name=logos,type=cloud-storage,bucket=stiers-orgdesk-logos"
--add-volume-mount:
  - "volume=uploads,mount-path=/app/uploads"
  - "volume=logos,mount-path=/app/public/images/orgs"
--set-env-vars: "NODE_ENV=production,MONGO_DB=Web-Tech,COOKIE_SECURE=true"
--set-secrets: "MONGO_URI=orgdesk-mongo-uri:latest,SESSION_SECRET=orgdesk-session-secret:latest,INTERNAL_AUTH_TOKEN=orgdesk-internal-auth-token:latest"
YAML

echo
echo "=== deploying orgdesk-api via --flags-file ==="
gcloud run deploy orgdesk-api \
  --flags-file=/tmp/orgdesk-api-flags.yaml \
  --log-http 2>&1 | grep -i -E '"mountPath"|"status": |ERROR|error \(|Deploying|Creating Revision|Done\.' | head -20

echo
echo "=== resulting service, if any ==="
gcloud run services describe orgdesk-api --project stiers --region asia-southeast1 \
  --format="value(status.url,status.conditions[0].type)" 2>&1 | head -3

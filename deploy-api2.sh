# Deploy the API service, excluding only the arguments whose VALUES contain unix
# paths from MSYS rewriting.
#
# MSYS2_ARG_CONV_EXCL is a prefix list, not a global switch: arguments starting
# with these prefixes pass through untouched while everything else is still
# translated - which matters, because gcloud's own launcher needs that translation
# to locate its bundled Python (MSYS_NO_PATHCONV breaks it outright).
#
# This deploys the real service name, so success is actual progress.

export MSYS2_ARG_CONV_EXCL='--add-volume-mount;--add-volume;--set-secrets;--set-env-vars'
echo "MSYS2_ARG_CONV_EXCL=${MSYS2_ARG_CONV_EXCL}"
echo

gcloud run deploy orgdesk-api \
  --project stiers \
  --region asia-southeast1 \
  --image asia-southeast1-docker.pkg.dev/stiers/orgdesk/orgdesk-api:dd2e7a9 \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 1 \
  --execution-environment gen2 \
  --allow-unauthenticated \
  --timeout 300 \
  --add-volume "name=uploads,type=cloud-storage,bucket=stiers-orgdesk-uploads" \
  --add-volume "name=logos,type=cloud-storage,bucket=stiers-orgdesk-logos" \
  --add-volume-mount "volume=uploads,mount-path=/app/uploads" \
  --add-volume-mount "volume=logos,mount-path=/app/public/images/orgs" \
  --set-env-vars "NODE_ENV=production,MONGO_DB=Web-Tech,COOKIE_SECURE=true" \
  --set-secrets "MONGO_URI=orgdesk-mongo-uri:latest,SESSION_SECRET=orgdesk-session-secret:latest,INTERNAL_AUTH_TOKEN=orgdesk-internal-auth-token:latest" \
  --log-http 2>&1 \
  | grep -o -E '"mountPath": "[^"]*"|"secretKeyRef": \{[^}]*\}|"status": *[0-9]+|ERROR:.*' | head -14

echo
echo "=== service state ==="
gcloud run services describe orgdesk-api --project stiers --region asia-southeast1 \
  --format="value(status.url)" 2>&1 | head -2

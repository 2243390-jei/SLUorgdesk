# Deploy the API service, escaping the leading slash as "//".
#
# Why: MSYS rewrites an argument value that begins with "/" by prepending its own
# root, so mount-path=/app/uploads arrives at gcloud as
# C:/Program Files/Git/app/uploads and Cloud Run rejects it. MSYS leaves paths
# starting with "//" alone (it treats them as UNC-like), and the Linux VFS
# collapses repeated slashes, so "//app/uploads" is the same directory as
# "/app/uploads" at runtime. This stays correct when run from Linux, where the
# value is passed through literally.

echo "=== deploying orgdesk-api with //-escaped mount paths ==="

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
  --add-volume-mount "volume=uploads,mount-path=//app/uploads" \
  --add-volume-mount "volume=logos,mount-path=//app/public/images/orgs" \
  --set-env-vars "NODE_ENV=production,MONGO_DB=Web-Tech,COOKIE_SECURE=true" \
  --set-secrets "MONGO_URI=orgdesk-mongo-uri:latest,SESSION_SECRET=orgdesk-session-secret:latest,INTERNAL_AUTH_TOKEN=orgdesk-internal-auth-token:latest" \
  --log-http 2>&1 \
  | grep -o -E '"mountPath": "[^"]*"|"status": *[0-9]+|ERROR:.*|Done\.' | head -10

echo
echo "=== service state ==="
gcloud run services describe orgdesk-api --project stiers --region asia-southeast1 \
  --format="value(status.url,status.conditions[0].type,status.conditions[0].status)" 2>&1 | head -3

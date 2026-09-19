# Diagnostic: what does gcloud actually send for --add-volume-mount?
#
# The deploy failed with:
#   containers[0].volume_mounts[0].mount_path: should be a valid unix absolute path
#
# This deploys a throwaway service name that will fail validation the same way, with
# HTTP logging on, so the request body shows the value gcloud parsed. Nothing is
# created because validation rejects the request.

echo "=== what gcloud received ==="
echo "arg: [volume=uploads,mount-path=/app/uploads]"
echo

echo "=== gcloud deploy --log-http, request body ==="
gcloud run deploy diag-orgdesk-volume-mount \
  --project stiers \
  --region asia-southeast1 \
  --image asia-southeast1-docker.pkg.dev/stiers/orgdesk/orgdesk-api:dd2e7a9 \
  --add-volume "name=uploads,type=cloud-storage,bucket=stiers-orgdesk-uploads" \
  --add-volume-mount "volume=uploads,mount-path=/app/uploads" \
  --log-http 2>&1 | grep -i -B2 -A6 'mountPath' | head -40

echo
echo "=== exit code chain above; no service should have been created ==="

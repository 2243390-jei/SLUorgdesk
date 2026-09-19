#!/usr/bin/env bash
# =============================================================================
# SLU OrgDesk - Node API container entrypoint
#
# The Express app resolves its writable paths relative to its own directory:
#   - /app/uploads                 (app.js  -> express.static('/uploads'))
#   - /app/public/images/orgs      (middleware/upload.js -> multer destination)
#
# Both are shared with the web container, so a freshly-mounted root-owned volume
# must be handed to the unprivileged `node` user before privileges are dropped.
# =============================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/app/node-server}"
RUN_USER="${RUN_USER:-node}"

echo "[entrypoint] app dir      : ${APP_DIR}"
echo "[entrypoint] port         : ${PORT:-5000}"
echo "[entrypoint] node_env     : ${NODE_ENV:-development}"

if [ -z "${MONGO_URI:-}" ]; then
  echo "[entrypoint] warning: MONGO_URI is not set - the API will fail to start" >&2
fi
if [ -z "${SESSION_SECRET:-}" ]; then
  echo "[entrypoint] warning: SESSION_SECRET is not set - falling back to an insecure default" >&2
fi

# -----------------------------------------------------------------------------
# Shared, runtime-writable directories.
# `chown` fails on object-storage mounts; in that case run as the mount owner
# by setting RUN_AS_ROOT=1 (see deploy/README).
# -----------------------------------------------------------------------------
for dir in /app/uploads /app/public/images/orgs; do
  mkdir -p "${dir}"
  chown -R "${RUN_USER}:${RUN_USER}" "${dir}" 2>/dev/null || true
done

if [ "${RUN_AS_ROOT:-0}" = "1" ]; then
  echo "[entrypoint] starting as root (RUN_AS_ROOT=1)"
  cd "${APP_DIR}"
  exec "$@"
fi

echo "[entrypoint] starting as ${RUN_USER}"
cd "${APP_DIR}"
exec gosu "${RUN_USER}" "$@"

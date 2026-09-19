#!/usr/bin/env bash
# =============================================================================
# SLU OrgDesk - web container entrypoint (Apache + mod_php)
#
# Responsibilities:
#   1. Bind Apache to the platform-injected port (Cloud Run sets $PORT=8080).
#   2. Render the virtual host, wiring the Node API upstream and the
#      optional internal-auth shared secret.
#   3. Ensure the runtime-writable directories exist and are owned by the
#      Apache user, so that a freshly-mounted (root-owned) volume is writable.
#
# Runs as root, then delegates to the standard `apache2-foreground` script which
# drops worker privileges to www-data.
# =============================================================================
set -euo pipefail

DOC_ROOT="${DOC_ROOT:-/var/www/html}"
NODE_API_URL="${NODE_API_URL:-http://127.0.0.1:5000}"
INTERNAL_AUTH_TOKEN="${INTERNAL_AUTH_TOKEN:-}"
HTTP_PORT="${PORT:-80}"

export DOC_ROOT NODE_API_URL INTERNAL_AUTH_TOKEN HTTP_PORT

echo "[entrypoint] document root : ${DOC_ROOT}"
echo "[entrypoint] listening on  : ${HTTP_PORT}"
echo "[entrypoint] node upstream : ${NODE_API_URL}"
if [ -n "${INTERNAL_AUTH_TOKEN}" ]; then
  echo "[entrypoint] internal auth : enabled"
else
  echo "[entrypoint] internal auth : DISABLED (no INTERNAL_AUTH_TOKEN set)"
fi

# -----------------------------------------------------------------------------
# 1. Bind to the injected port. The base image listens on 80; Cloud Run
#    requires the container to listen on $PORT (8080 by default).
# -----------------------------------------------------------------------------
sed -ri "s/^\s*Listen\s+.*/Listen ${HTTP_PORT}/" /etc/apache2/ports.conf

# -----------------------------------------------------------------------------
# 2. Render and activate the virtual host.
#    envsubst is given an explicit variable list so that Apache's own
#    ${...} syntax (and any literal $ in config values) is left untouched.
# -----------------------------------------------------------------------------
envsubst '${DOC_ROOT} ${NODE_API_URL} ${INTERNAL_AUTH_TOKEN} ${HTTP_PORT}' \
  < /etc/apache2/sites-templates/orgdesk.conf.template \
  > /etc/apache2/sites-available/orgdesk.conf

a2dissite 000-default >/dev/null 2>&1 || true
a2ensite orgdesk >/dev/null 2>&1 || true

# -----------------------------------------------------------------------------
# 3. TLS awareness. On Cloud Run every request arrives over HTTPS, so PHP must
#    mark its session cookie Secure. Locally (plain HTTP) this stays off,
#    otherwise the browser would discard the login cookie.
# -----------------------------------------------------------------------------
if [ "${PHP_SESSION_COOKIE_SECURE:-0}" = "1" ]; then
  echo "session.cookie_secure = 1" > /usr/local/etc/php/conf.d/zz-orgdesk-secure.ini
  echo "[entrypoint] secure session cookies : ON"
else
  rm -f /usr/local/etc/php/conf.d/zz-orgdesk-secure.ini
  echo "[entrypoint] secure session cookies : off"
fi

# -----------------------------------------------------------------------------
# 4. Runtime-writable directories.
#    These are volume mount points. A Docker named volume or a Cloud Storage
#    volume arrives owned by root, so the Apache worker user needs ownership
#    handed over. `chown` is a no-op on object-storage mounts (read-only
#    metadata), hence the tolerated failure - in that case run Apache as the
#    mount owner instead by setting APACHE_RUN_AS_ROOT=1 (see deploy/README).
# -----------------------------------------------------------------------------
for dir in "${DOC_ROOT}/uploads" "${DOC_ROOT}/public/images/orgs"; do
  mkdir -p "${dir}"
  chown -R www-data:www-data "${dir}" 2>/dev/null \
    || echo "[entrypoint] warning: could not chown ${dir} (object-storage mount?)"
done

# A volume mounted over uploads/ replaces the directory contents, which hides the
# access-control guard that ships in the image. Put it back from the pristine copy
# baked outside the mount point.
if [ -d /opt/orgdesk/uploads-guard ]; then
  for guard in .htaccess redirect.php; do
    if [ ! -e "${DOC_ROOT}/uploads/${guard}" ]; then
      if cp "/opt/orgdesk/uploads-guard/${guard}" "${DOC_ROOT}/uploads/${guard}" 2>/dev/null; then
        echo "[entrypoint] restored uploads/${guard} (masked by the volume mount)"
      else
        echo "[entrypoint] warning: could not restore uploads/${guard}"
      fi
    fi
  done
fi

if [ "${APACHE_RUN_AS_ROOT:-0}" = "1" ]; then
  echo "[entrypoint] running Apache workers as root (APACHE_RUN_AS_ROOT=1)"
  printf 'User root\nGroup root\n' > /etc/apache2/conf-available/zz-run-as-root.conf
  a2enconf zz-run-as-root >/dev/null 2>&1 || true
fi

echo "[entrypoint] config summary:"
apache2ctl -t 2>&1 | sed 's/^/[entrypoint]   /'

exec "$@"

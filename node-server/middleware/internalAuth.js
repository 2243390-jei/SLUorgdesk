/**
 * Shared-secret guard for the proxied API surface.
 *
 * The Node API is reached from the browser through the web container's Apache
 * reverse proxy (see docker/apache/orgdesk.conf.template), which stamps every
 * forwarded request with `X-Internal-Auth`. Requests that arrive without the
 * matching secret are rejected, so the API cannot be driven directly even if the
 * Cloud Run service happens to be publicly reachable.
 *
 * The check is deliberately opt-in: when INTERNAL_AUTH_TOKEN is unset the
 * middleware is a no-op, which keeps `npm start` and local Docker workflows
 * unchanged.
 */

const TOKEN = process.env.INTERNAL_AUTH_TOKEN || '';

/**
 * Was this request relayed by our own reverse proxy?
 *
 * Used by the CORS layer: a proxied request is same-origin by construction, and
 * browsers attach an `Origin` header even to same-origin POSTs, so treating it
 * as a cross-origin caller would reject every login and form submission.
 */
function fromProxy(req) {
  return Boolean(TOKEN) && req.get('X-Internal-Auth') === TOKEN;
}

function internalAuth(req, res, next) {
  // Disabled when no secret is configured.
  if (!TOKEN) return next();

  // CORS preflight requests never carry custom headers.
  if (req.method === 'OPTIONS') return next();

  if (fromProxy(req)) return next();

  return res.status(403).json({ success: false, error: 'Forbidden' });
}

module.exports = internalAuth;
module.exports.token = TOKEN;
module.exports.fromProxy = fromProxy;

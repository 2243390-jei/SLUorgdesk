// Dynamic API Configuration for Frontend
//
// The API is served from the SAME ORIGIN as the frontend: the web container
// reverse-proxies /api/* to the Node service. Two reasons this matters:
//   1. Both session cookies (PHPSESSID and connect.sid) stay first-party, so
//      no SameSite=None / third-party-cookie workarounds are needed.
//   2. The previous hardcoded `:5000` port cannot work on Cloud Run, which
//      serves HTTPS on 443 and injects a single $PORT inside the container.
//
// To point the frontend at a separately hosted API instead, define
// window.__API_BASE__ before this script is loaded:
//   <script>window.__API_BASE__ = 'https://orgdesk-api-xxxx.run.app';</script>
const API_CONFIG = (() => {
  const override =
    typeof window !== 'undefined' && window.__API_BASE__
      ? String(window.__API_BASE__).replace(/\/+$/, '')
      : null;

  // '' means same origin, so `${apiBase}/api/users` stays a relative URL.
  const apiBase = override !== null ? override : '';
  
  return {
    // Kept for backward compatibility with existing call sites.
    baseUrl: apiBase,
    apiBase: apiBase,
    statsEndpoint: `${apiBase}/api/stats`,
    organizationsEndpoint: `${apiBase}/api/organizations`,
    // dashboard.js reads this spelling; it previously fell back to a literal.
    orgsEndpoint: `${apiBase}/api/organizations`,
    usersEndpoint: `${apiBase}/api/users`
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
}

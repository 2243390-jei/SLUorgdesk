// Dynamic API Configuration for Frontend
const API_CONFIG = (() => {
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  const port = 5000
  const apiBase = `${protocol}//${hostname}:${port}`
  
  return {
    apiBase: apiBase,
    statsEndpoint: `${apiBase}/api/stats`,
    organizationsEndpoint: `${apiBase}/api/Organizations`,
    usersEndpoint: `${apiBase}/api/User`
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
}

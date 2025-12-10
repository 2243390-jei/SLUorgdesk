// Logout wiring — attach handler immediately or on DOMContentLoaded
function bindAdminLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  
  if (!logoutBtn || !logoutModal) return;
  if (logoutBtn._logoutBound) return;
  logoutBtn._logoutBound = true;
  
  // Show modal when logout button clicked
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    logoutModal.classList.add('show');
  });
  
  // Cancel logout
  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      logoutModal.classList.remove('show');
    });
  }
  
  // Confirm logout
  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try { 
        await fetch('../../php-server/routes/logout.php', { method: 'POST' }); 
      } catch (err) { 
        console.error('Logout error:', err); 
      }
      window.location.href = '../../index.php';
    });
  }
  
  // Close modal when clicking outside
  logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
      e.preventDefault();
      e.stopPropagation();
      logoutModal.classList.remove('show');
    }
  });
}

// Auto-bind on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindAdminLogout);
} else {
  bindAdminLogout();
}

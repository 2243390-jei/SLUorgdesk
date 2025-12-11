// Logout wiring — attach handler immediately or on DOMContentLoaded

// Check if user session is valid - redirect to login if not
async function verifySession() {
  try {
    const response = await fetch(`${API_CONFIG.apiBase}/api/users/me`, {
      method: 'GET',
      credentials: 'include' // Include cookies for session
    });

    
    if (!response.ok) {
      // Session invalid or expired - redirect to index
      const errData = await response.json().catch(() => ({}));
      window.location.href = '../../index.php';
      return false;
    }
    const data = await response.json();
    return true;
  } catch (err) {
    // On error, assume session is invalid - redirect to login
    window.location.href = '../../index.php';
    return false;
  }
}

// Only verify session on protected admin pages (not on login page)
// Check if this is an admin page by checking if we're in the admin folder
function isAdminPage() {
  return window.location.pathname.includes('/admin/');
}

// Verify session on admin pages
if (isAdminPage()) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verifySession);
  } else {
    verifySession();
  }
}

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
        // Call Node.js logout endpoint to destroy session
        await fetch(`${API_CONFIG.apiBase}/api/users/logout`, { 
          method: 'POST',
          credentials: 'include'
        }); 
      } catch (err) { 
        console.error('Logout error:', err); 
      }
      // Clear any client-side storage
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      // Redirect to index
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

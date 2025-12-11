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

// Mobile menu toggle functionality
function initMobileMenu() {
  // Only initialize on mobile devices
  if (window.innerWidth > 768) return;

  const sidebar = document.getElementById('sidebar');
  const sidebarNav = document.getElementById('sidebar-nav');
  const sidebarFooter = document.getElementById('sidebar-footer');
  
  if (!sidebar || !sidebarNav) return;
  if (sidebar._mobileMenuInit) return;
  sidebar._mobileMenuInit = true;

  // Create and add mobile menu toggle button if it doesn't exist
  let menuToggle = document.querySelector('.mobile-menu-toggle');
  if (!menuToggle) {
    menuToggle = document.createElement('button');
    menuToggle.className = 'mobile-menu-toggle';
    menuToggle.setAttribute('aria-label', 'Toggle Menu');
    menuToggle.innerHTML = '☰';
    sidebar.appendChild(menuToggle);
  }

  // Toggle menu visibility
  menuToggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sidebarNav.classList.toggle('active');
    menuToggle.classList.toggle('active');
  });

  // Close menu when a navigation link is clicked
  const navLinks = sidebarNav.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      sidebarNav.classList.remove('active');
      menuToggle.classList.remove('active');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && sidebarNav.classList.contains('active')) {
      sidebarNav.classList.remove('active');
      menuToggle.classList.remove('active');
    }
  });
}

// Handle window resize for responsive behavior
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    const sidebarNav = document.getElementById('sidebar-nav');
    if (sidebarNav) {
      sidebarNav.classList.remove('active');
    }
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    if (menuToggle) {
      menuToggle.classList.remove('active');
    }
  }
});

// Auto-bind on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bindAdminLogout();
    initMobileMenu();
  });
} else {
  bindAdminLogout();
  initMobileMenu();
}

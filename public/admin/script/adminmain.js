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

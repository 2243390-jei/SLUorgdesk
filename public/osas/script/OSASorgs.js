const tableBody = document.getElementById("orgTableBody");
const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");

// Store all organizations for filtering
let organizationsData = []; 

// Modal Elements
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const logoutModalClose = document.getElementById('logoutModalClose');
const logoutCancel = document.getElementById('logoutCancel');
const logoutConfirm = document.getElementById('logoutConfirm');

// Hamburger menu elements
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.querySelector('.leftbar.sidebar-expanded');
let overlay = null;

// Create mobile overlay if it doesn't exist
function createMobileOverlay() {
  if (!document.querySelector('.mobile-overlay')) {
    overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);
  } else {
    overlay = document.querySelector('.mobile-overlay');
  }
}

// Toggle mobile menu
function toggleMobileMenu() {
  if (!sidebar || !overlay) return;
  
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
  
  // Prevent body scroll when menu is open
  if (sidebar.classList.contains('open')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

// Initialize hamburger menu
function initHamburgerMenu() {
  // Create overlay
  createMobileOverlay();
  
  if (mobileMenuToggle && sidebar && overlay) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    overlay.addEventListener('click', toggleMobileMenu);
    
    // Close menu when clicking logout button on mobile
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768 && sidebar && overlay) {
          sidebar.classList.remove('open');
          overlay.classList.remove('show');
          document.body.style.overflow = '';
        }
      });
    }
    
    // Close menu when clicking nav items on mobile
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768 && sidebar && overlay) {
          sidebar.classList.remove('open');
          overlay.classList.remove('show');
          document.body.style.overflow = '';
        }
      });
    });
    
    // Close menu on window resize if needed
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  }
}

// Initialize hamburger menu on DOM load
document.addEventListener('DOMContentLoaded', initHamburgerMenu);

async function loadOrganizations() {
  try {
    const response = await fetch("../../php-server/routes/organizations.php");
    const result = await response.json();
    const organizations = result.success ? result.data : [];
    organizationsData = organizations; // save for filtering

    renderTable(organizations);
    initializeResponsiveTable(); // Initialize responsive layout after loading data
  } catch (error) {
    console.error("Error loading organizations:", error);
  }
}

// Render organizations to table
function renderTable(orgs) {
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (orgs.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" style="padding:10px; color:gray;">No organizations found.</td></tr>`;
    return;
  }

  orgs.forEach(org => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><img src="${org.localLogoPath}" alt="${org.acronym} logo" class="org-logo"></td>
      <td>${org.acronym}</td>
      <td>${org.school}</td>
      <td><button class="view-btn">View Submissions</button></td>
    `;

    // Redirection to go to OSASsubmissions.php using org ID and orgName when the button is clicked
    row.querySelector(".view-btn").addEventListener("click", () => {
      window.location.href = `../osas/osassubmissions.php?orgId=${org._id}&orgName=${encodeURIComponent(org.acronym)}`;
    });

    tableBody.appendChild(row);
  });

  // Update responsive layout after rendering
  if (typeof updateTableLayout === 'function') {
    updateTableLayout();
  }
}

// Enhanced responsive table layout function
function initializeResponsiveTable() {
  function updateTableLayout() {
    const rows = tableBody.getElementsByTagName('tr');
    
    for (let row of rows) {
      const cells = row.getElementsByTagName('td');
      if (cells.length >= 3) {
        const firstCell = cells[0];
        const orgNameCell = cells[1];
        const schoolCell = cells[2];
        const actionCell = cells[3];
        
        if (window.innerWidth <= 768) {
          // Mobile layout - combine image, name, and school in first cell
          const orgImage = firstCell.querySelector('.org-logo') ? firstCell.querySelector('.org-logo').outerHTML : firstCell.innerHTML;
          const orgName = orgNameCell.textContent;
          const school = schoolCell.textContent;
          
          firstCell.innerHTML = `
            ${orgImage}
            <div class="org-info">
              <div class="org-name">${orgName}</div>
              <div class="org-school">${school}</div>
            </div>
          `;
          
          // Hide the original cells
          orgNameCell.style.display = 'none';
          schoolCell.style.display = 'none';
          actionCell.style.display = 'table-cell'; // Keep action cell visible
          
          // Ensure the row uses flex for side-by-side layout
          row.style.display = 'flex';
          row.style.flexDirection = 'column';
          firstCell.style.display = 'flex';
          firstCell.style.alignItems = 'center';
          firstCell.style.gap = '16px';
          firstCell.style.padding = '12px';
          
        } else {
          // Desktop layout - restore original structure
          const orgImage = firstCell.querySelector('.org-logo');
          if (orgImage) {
            firstCell.innerHTML = orgImage.outerHTML;
          }
          orgNameCell.style.display = '';
          schoolCell.style.display = '';
          actionCell.style.display = '';
          row.style.display = '';
          firstCell.style.display = '';
        }
      }
    }
  }
  
  // Initial setup
  updateTableLayout();
  
  // Update on resize
  window.addEventListener('resize', updateTableLayout);
}

// Filter function using the Search Bar
function filterOrganizations() {
  const query = searchInput.value.toLowerCase().trim();

  if (query === "") {
    renderTable(organizationsData);
    return;
  }

  const filtered = organizationsData.filter(org =>
    org.acronym.toLowerCase().includes(query) ||
    org.school.toLowerCase().includes(query)
  );

  renderTable(filtered);
}

// Clear search
if (searchClear) {
  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    renderTable(organizationsData);
  });
}

// Searching
if (searchInput) {
  searchInput.addEventListener("input", filterOrganizations);
}

// === Filter Dropdown ===
const filterToggle = document.getElementById("filterToggle");
const filterMenu = document.getElementById("filterMenu");

if (filterToggle && filterMenu) {
  filterToggle.addEventListener("click", () => {
    filterMenu.classList.toggle("hidden");
  });

  // Filter by School
  document.querySelectorAll(".filter-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const school = btn.dataset.filter;
      const filtered = organizationsData.filter(org => org.school === school);
      renderTable(filtered);
      filterMenu.classList.add("hidden");
    });
  });

  // Clear Filters
  const filterClear = document.querySelector(".filter-clear");
  if (filterClear) {
    filterClear.addEventListener("click", () => {
      renderTable(organizationsData);
      filterMenu.classList.add("hidden");
    });
  }

  // Hide dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (filterMenu && !filterMenu.contains(e.target) && filterToggle && !filterToggle.contains(e.target)) {
      filterMenu.classList.add("hidden");
    }
  });
}

// ========== LOGOUT MODAL FUNCTIONALITY ==========

// Show logout confirmation modal
function showLogoutModal() {
  if (logoutModal) {
    logoutModal.classList.add('show');
    logoutModal.setAttribute('aria-hidden', 'false');
  }
}

// Hide logout confirmation modal
function hideLogoutModal() {
  if (logoutModal) {
    logoutModal.classList.remove('show');
    logoutModal.setAttribute('aria-hidden', 'true');
  }
}

// Logout function
function performLogout() {
  // Redirect to ../index.php instead of login.html
  try {
    fetch('../../php-server/routes/logout.php', { method: 'POST' });
  } catch (err) {
    console.error('Logout error:', err);
  }

  // Redirect to login
  window.location.href = '../../index.php';
}

// Event listeners for logout functionality
if (logoutBtn) {
  logoutBtn.addEventListener('click', showLogoutModal);
}
if (logoutModalClose) {
  logoutModalClose.addEventListener('click', hideLogoutModal);
}
if (logoutCancel) {
  logoutCancel.addEventListener('click', hideLogoutModal);
}
if (logoutConfirm) {
  logoutConfirm.addEventListener('click', performLogout);
}

// Close logout modal when clicking on overlay
if (logoutModal) {
  logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
      hideLogoutModal();
    }
  });
}

// Initial load of organizations
loadOrganizations();
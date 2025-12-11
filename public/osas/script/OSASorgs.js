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
const sidebar = document.querySelector('.sidebar');
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
    
    // Navigation between pages
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const page = item.getAttribute('data-page');
            if (page) {
                navigateToPage(page);
            }
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
      showSubmissionsModal(org._id, org.acronym);
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

// --- SUBMISSION MODALS EVENT LISTENERS ---
const submissionsModal = document.getElementById('submissionsModal');
const closeSubmissionsModal = document.getElementById('closeSubmissionsModal');
const closeSubmissionsModalBtn = document.getElementById('closeSubmissionsModalBtn');

const submissionDetailsModal = document.getElementById('submissionDetailsModal');
const closeSubmissionDetailsModal = document.getElementById('closeSubmissionDetailsModal');
const backToSubmissionsBtn = document.getElementById('backToSubmissionsBtn');
const closeSubmissionDetailsBtn = document.getElementById('closeSubmissionDetailsBtn');

if (closeSubmissionsModal) {
  closeSubmissionsModal.addEventListener('click', hideSubmissionsModal);
}

if (closeSubmissionsModalBtn) {
  closeSubmissionsModalBtn.addEventListener('click', hideSubmissionsModal);
}

if (closeSubmissionDetailsModal) {
  closeSubmissionDetailsModal.addEventListener('click', hideSubmissionDetailsModal);
}

if (backToSubmissionsBtn) {
  backToSubmissionsBtn.addEventListener('click', () => {
    hideSubmissionDetailsModal();
    // Show submissions modal again
    if (submissionsModal) {
      submissionsModal.classList.add('show');
      submissionsModal.setAttribute('aria-hidden', 'false');
    }
  });
}

if (closeSubmissionDetailsBtn) {
  closeSubmissionDetailsBtn.addEventListener('click', () => {
    hideSubmissionDetailsModal();
    hideSubmissionsModal();
  });
}

// Close modals on background click
if (submissionsModal) {
  submissionsModal.addEventListener('click', (e) => {
    if (e.target === submissionsModal) {
      hideSubmissionsModal();
    }
  });
}

if (submissionDetailsModal) {
  submissionDetailsModal.addEventListener('click', (e) => {
    if (e.target === submissionDetailsModal) {
      hideSubmissionDetailsModal();
    }
  });
}

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideSubmissionDetailsModal();
    hideSubmissionsModal();
  }
});

// --- SUBMISSIONS MODAL FUNCTIONS ---
let allSubmissions = []; // Store all submissions for filtering

async function showSubmissionsModal(orgId, orgName) {
  const modal = document.getElementById('submissionsModal');
  const modalBody = document.getElementById('submissionsListBody');
  
  if (!modal || !modalBody) return;
  
  // Update modal title
  document.getElementById('submissionsModalTitle').textContent = `${orgName} - Submissions`;
  
  // Show loading state
  modalBody.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted);">Loading submissions...</div>';
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  
  try {
    // Fetch submissions for this organization
    const response = await fetch(`../../php-server/routes/submissions.php?organizationId=${orgId}`);
    const result = await response.json();
    allSubmissions = result.success ? result.data : [];
    
    if (allSubmissions.length === 0) {
      modalBody.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted);">No submissions found for this organization.</div>';
      return;
    }
    
    // Extract filter options
    const eventTypes = [...new Set(allSubmissions.map(s => s.event?.eventType).filter(Boolean))];
    const venues = [...new Set(allSubmissions.map(s => s.event?.eventVenue).filter(Boolean))];
    const sdgs = [...new Set(allSubmissions.flatMap(s => s.event?.eventSDG || []))];
    
    // Build filters HTML
    let html = `
      <div class="submissions-header">
        <div class="search-container">
          <input type="text" id="searchSubmissions" placeholder="Search event name..." class="search-input">
        </div>
        
        <button id="filterToggleBtn" class="filter-btn">
          <img src="../images/osas/filter.png" alt="filter" class="filter-icon" style="width: 18px; height: 18px;">
        </button>
        
        <div id="filterPanel" class="filter-panel hidden">
          <button class="filter-category" data-category="sdg">
            <span>SDG Goals</span>
            <span class="arrow">›</span>
          </button>
          <div class="filter-sub hidden" data-type="sdg">
            <button data-back class="filter-back-btn">‹ Back</button>
            ${sdgs.map(sdg => `<button data-sdg="${sdg}">${sdg}</button>`).join('')}
          </div>
          
          <button class="filter-category" data-category="type">
            <span>Event Type</span>
            <span class="arrow">›</span>
          </button>
          <div class="filter-sub hidden" data-type="type">
            <button data-back class="filter-back-btn">‹ Back</button>
            ${eventTypes.map(type => `<button data-type="${type}">${type}</button>`).join('')}
          </div>
          
          <button class="filter-category" data-category="venue">
            <span>Venue</span>
            <span class="arrow">›</span>
          </button>
          <div class="filter-sub hidden" data-type="venue">
            <button data-back class="filter-back-btn">‹ Back</button>
            ${venues.map(venue => `<button data-venue="${venue}">${venue}</button>`).join('')}
          </div>
        </div>
      
      <table class="submissions-table">
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Type</th>
            <th>Date</th>
            <th>Venue</th>
            <th>SDG Goals</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="submissionsTableBody">
        </tbody>
      </table>
    `;
    
    modalBody.innerHTML = html;
    
    // Render submissions table
    renderSubmissionsTable(allSubmissions);
    
    // Attach filter listeners
    initializeHierarchicalFilter();
    
    // Attach search listener
    document.getElementById('searchSubmissions').addEventListener('keyup', searchSubmissions);
    
    // Attach filter panel toggle
    document.getElementById('filterToggleBtn').addEventListener('click', toggleFilterPanel);
    
  } catch (error) {
    console.error('Error loading submissions:', error);
    modalBody.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Failed to load submissions.</div>';
  }
}

function renderSubmissionsTable(submissions) {
  const tbody = document.getElementById('submissionsTableBody');
  if (!tbody) return;
  
  if (submissions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--muted);">No submissions match the selected filters.</td></tr>';
    return;
  }
  
  let html = '';
  submissions.forEach(sub => {
    const event = sub.event || {};
    const eventName = event.eventName || 'Unnamed Event';
    const eventType = event.eventType || 'N/A';
    const eventDate = event.eventDate || 'N/A';
    const eventVenue = event.eventVenue || 'N/A';
    const sdgs = event.eventSDG && event.eventSDG.length > 0 ? event.eventSDG.join(', ') : 'None';
    
    html += `
      <tr>
        <td>${eventName}</td>
        <td>${eventType}</td>
        <td>${eventDate}</td>
        <td>${eventVenue}</td>
        <td class="sdg-cell">${sdgs}</td>
        <td><button class="view-details-link" data-event='${JSON.stringify(event).replace(/'/g, "&#39;")}'>View Details</button></td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  
  // Attach event listeners to view details buttons
  document.querySelectorAll('.view-details-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const eventData = JSON.parse(e.target.getAttribute('data-event'));
      showSubmissionDetailsModal(eventData);
    });
  });
}

function toggleFilterPanel() {
  const filterPanel = document.getElementById('filterPanel');
  if (filterPanel) {
    filterPanel.classList.toggle('hidden');
  }
}

// Initialize hierarchical filter for submissions modal
function initializeHierarchicalFilter() {
  const filterPanel = document.getElementById('filterPanel');
  const filterBtn = document.getElementById('filterToggleBtn');
  const categoryBtns = document.querySelectorAll('.filter-category');
  const backBtns = document.querySelectorAll('.filter-back-btn');
  let currentFilter = null;
  
  // Close filter panel on outside click
  document.addEventListener('click', (e) => {
    if (filterPanel && !filterPanel.classList.contains('hidden')) {
      const isClickInside = filterPanel.contains(e.target) || (filterBtn && filterBtn.contains(e.target));
      if (!isClickInside) {
        filterPanel.classList.add('hidden');
      }
    }
  });
  
  // Category button clicks - show subcategories
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const category = btn.getAttribute('data-category');
      const subMenu = document.querySelector(`.filter-sub[data-type="${category}"]`);
      
      if (subMenu) {
        // Hide all other submenus
        document.querySelectorAll('.filter-sub').forEach(menu => {
          if (menu !== subMenu) {
            menu.classList.add('hidden');
          }
        });
        // Toggle current submenu
        subMenu.classList.toggle('hidden');
      }
    });
  });
  
  // Back button clicks - return to main categories
  backBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const subMenu = btn.closest('.filter-sub');
      if (subMenu) {
        subMenu.classList.add('hidden');
      }
    });
  });
  
  // Filter option clicks
  document.querySelectorAll('[data-sdg], [data-type], [data-venue]').forEach(btn => {
    if (btn.closest('.filter-sub')) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const filterType = btn.getAttribute('data-sdg') ? 'sdg' : 
                          btn.getAttribute('data-type') ? 'type' : 'venue';
        const selectedValue = btn.getAttribute(`data-${filterType}`);
        
        currentFilter = { type: filterType, value: selectedValue };
        applyHierarchicalFilter(currentFilter);
        
        // Close dropdown after selection
        if (filterPanel) {
          filterPanel.classList.add('hidden');
        }
      });
    }
  });
}

// Apply hierarchical filter
function applyHierarchicalFilter(filter) {
  const filtered = allSubmissions.filter(sub => {
    const event = sub.event || {};
    
    if (filter.type === 'sdg') {
      return event.eventSDG && event.eventSDG.includes(filter.value);
    } else if (filter.type === 'type') {
      return event.eventType === filter.value;
    } else if (filter.type === 'venue') {
      return event.eventVenue === filter.value;
    }
    return true;
  });
  
  renderSubmissionsTable(filtered);
}

function searchSubmissions() {
  const searchTerm = document.getElementById('searchSubmissions')?.value.toLowerCase() || '';
  
  const filtered = allSubmissions.filter(sub => {
    const event = sub.event || {};
    const matchesSearch = !searchTerm || (event.eventName && event.eventName.toLowerCase().includes(searchTerm));
    return matchesSearch;
  });
  
  renderSubmissionsTable(filtered);
}

function showSubmissionDetailsModal(eventData) {
  const modal = document.getElementById('submissionDetailsModal');
  const modalBody = document.getElementById('submissionDetailsBody');
  
  if (!modal || !modalBody) return;
  
  // Update modal title
  document.getElementById('submissionDetailsModalTitle').textContent = eventData.eventName || 'Submission Details';
  
  // Build the submission details HTML
  const sdgs = eventData.eventSDG && eventData.eventSDG.length > 0 
    ? eventData.eventSDG.map(sdg => `<span class="sdg-tag">${sdg}</span>`).join('')
    : '<span style="color: var(--muted);">None</span>';
    
  const docs = (eventData.supportingDocuments || []).length > 0
    ? `<div class="document-links">${eventData.supportingDocuments.map((doc, i) => {
        let docPath = doc;
        if (doc.startsWith('http')) {
          // Already a full URL, use as-is
          docPath = doc;
        } else if (doc.startsWith('/uploads/')) {
          // Starts with /uploads/, prepend /Sluorgdesk/
          docPath = `/SLUorgdesk${doc}`;
        } else if (doc.startsWith('uploads/')) {
          // Starts with uploads/, prepend /Sluorgdesk/
          docPath = `/SLUorgdesk/${doc}`;
        } else if (!doc.startsWith('/')) {
          // Relative path, prepend /Sluorgdesk/
          docPath = `/SLUorgdesk/${doc}`;
        }
        return `<a href="${docPath}" target="_blank" rel="noopener noreferrer">📄 Supporting Document ${i + 1}</a>`;
      }).join('')}</div>`
    : '<span style="color: var(--muted);">None</span>';
    
  const proofHTML = eventData.eventProof 
    ? `<a href="${eventData.eventProof}" target="_blank" rel="noopener noreferrer">View Event Proof</a>`
    : '<span style="color: var(--muted);">No proof uploaded</span>';

  const detailsHTML = `
    <div class="submission-details-grid">
      <div class="detail-section">
        <label>Event Name</label>
        <div class="value">${eventData.eventName || 'N/A'}</div>
      </div>
      
      <div class="detail-section">
        <label>Event Type</label>
        <div class="value">${eventData.eventType || 'N/A'}</div>
      </div>
      
      <div class="detail-section">
        <label>Event Date</label>
        <div class="value">${eventData.eventDate || 'N/A'}</div>
      </div>
      
      <div class="detail-section">
        <label>Start Time</label>
        <div class="value">${eventData.startTime || 'N/A'}</div>
      </div>
      
      <div class="detail-section">
        <label>End Time</label>
        <div class="value">${eventData.endTime || 'N/A'}</div>
      </div>
      
      <div class="detail-section">
        <label>Venue</label>
        <div class="value">${eventData.eventVenue || 'N/A'}</div>
      </div>
      
      <div class="detail-section">
        <label>Attendance</label>
        <div class="value">${eventData.attendance || 'N/A'}</div>
      </div>
      
      <div class="detail-section full-width">
        <label>SDG Goals</label>
        <div class="sdg-list">${sdgs}</div>
      </div>
      
      <div class="detail-section full-width">
        <label>Event Proof</label>
        <div class="value">${proofHTML}</div>
      </div>
      
      <div class="detail-section full-width">
        <label>Supporting Documents</label>
        <div class="value">${docs}</div>
      </div>
      
      ${eventData.eventDescription ? `
        <div class="detail-section full-width">
          <label>Description</label>
          <div class="value">${eventData.eventDescription}</div>
        </div>
      ` : ''}
      
      ${eventData.eventRemarks ? `
        <div class="detail-section full-width">
          <label>Remarks</label>
          <div class="value">${eventData.eventRemarks}</div>
        </div>
      ` : ''}
    </div>
  `;
  
  modalBody.innerHTML = detailsHTML;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function hideSubmissionsModal() {
  const modal = document.getElementById('submissionsModal');
  if (modal) {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function hideSubmissionDetailsModal() {
  const modal = document.getElementById('submissionDetailsModal');
  if (modal) {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }
}

// Navigation function
function navigateToPage(page) {
    const pages = {
        'calendar': 'calendar.php',
        'orgs': 'orgs.php',
        'analytics': 'analytics.php'
    };
    
    if (pages[page]) {
        window.location.href = pages[page];
    }
}

// Initial load of organizations
loadOrganizations();
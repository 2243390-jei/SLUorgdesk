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

const mobileProfileBtn = document.getElementById('mobileProfileBtn');
const profileModal = document.getElementById('profileModal');
const profileModalClose = document.getElementById('profileModalClose');

async function loadOrganizations() {
  try {
    const response = await fetch("../dataFetch/fetchDatabase.php");
    const organizations = await response.json();
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

    // Redirection to go to OSASsubmissions.html using org ID and orgName when the button is clicked
    row.querySelector(".view-btn").addEventListener("click", () => {
      window.location.href = `../osas/OSASsubmissions.html?orgId=${org._id}&orgName=${encodeURIComponent(org.acronym)}`;
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
searchClear.addEventListener("click", () => {
  searchInput.value = "";
  renderTable(organizationsData);
});

// Searching
searchInput.addEventListener("input", filterOrganizations);

// === Filter Dropdown ===
const filterToggle = document.getElementById("filterToggle");
const filterMenu = document.getElementById("filterMenu");

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
document.querySelector(".filter-clear").addEventListener("click", () => {
  renderTable(organizationsData);
  filterMenu.classList.add("hidden");
});

// Hide dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!filterMenu.contains(e.target) && !filterToggle.contains(e.target)) {
    filterMenu.classList.add("hidden");
  }
});

// ========== LOGOUT AND PROFILE MODAL FUNCTIONALITY ==========

// Show logout confirmation modal
function showLogoutModal() {
  logoutModal.classList.add('show');
  logoutModal.setAttribute('aria-hidden', 'false');
}

// Hide logout confirmation modal
function hideLogoutModal() {
  logoutModal.classList.remove('show');
  logoutModal.setAttribute('aria-hidden', 'true');
}

// Show profile modal (mobile)
function showProfileModal() {
  profileModal.classList.add('show');
  profileModal.setAttribute('aria-hidden', 'false');
  
  // Update modal content with direct logout button
  const modalContent = `
    <div class="profile-info">
      <div class="profile-large">O</div>
      <div class="profile-details">
        <h4>Hello, OSAS</h4>
        <div class="profile-logout">
          <button id="profileLogoutBtn" class="btn-logout">
            Logout
          </button>
        </div>
      </div>
    </div>
  `;
  
  profileModal.querySelector('.modal-body').innerHTML = modalContent;
  
  // Add direct logout event listener
  document.getElementById('profileLogoutBtn').addEventListener('click', () => {
    window.location.href = "../index.html";
  });
}

// Hide profile modal (mobile)
function hideProfileModal() {
  profileModal.classList.remove('show');
  profileModal.setAttribute('aria-hidden', 'true');
}

// Logout function
function performLogout() {
  // Redirect to index.html instead of login.html
  window.location.href = "../index.html";
}

// Event listeners for logout functionality
logoutBtn.addEventListener('click', showLogoutModal);
logoutModalClose.addEventListener('click', hideLogoutModal);
logoutCancel.addEventListener('click', hideLogoutModal);
logoutConfirm.addEventListener('click', performLogout);

// Event listeners for mobile profile modal
mobileProfileBtn.addEventListener('click', showProfileModal);
profileModalClose.addEventListener('click', hideProfileModal);

// Close modals when clicking on overlay
logoutModal.addEventListener('click', (e) => {
  if (e.target === logoutModal) {
    hideLogoutModal();
  }
});

profileModal.addEventListener('click', (e) => {
  if (e.target === profileModal) {
    hideProfileModal();
  }
});

// Initial load of organizations
loadOrganizations();
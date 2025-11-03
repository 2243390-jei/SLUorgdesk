const tableBody = document.getElementById("orgTableBody");
const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");

// Store all organizations for filtering
let organizationsData = []; 

async function loadOrganizations() {
  try {
    const response = await fetch("../dataFetch/fetchOrganizations.php");
    const organizations = await response.json();
    organizationsData = organizations; // save for filtering

    renderTable(organizations);
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
      <td><img src="${org.logoUrl}" alt="${org.acronym} logo" class="org-logo"></td>
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

// Initial load of Search
loadOrganizations();

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


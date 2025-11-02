// OSASorgs.js
const tableBody = document.getElementById("orgTableBody");
const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");

let organizationsData = []; // store all orgs for filtering

async function loadOrganizations() {
  try {
    const response = await fetch("http://localhost:3000/api/organizations");
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

    // ✅ When button is clicked, go to OSASsubmissions.html with org ID and orgName
    row.querySelector(".view-btn").addEventListener("click", () => {
      window.location.href = `../osas/OSASsubmissions.html?orgId=${org._id}&orgName=${encodeURIComponent(org.acronym)}`;
    });

    tableBody.appendChild(row);
  });
}

// Filter function (search bar)
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

// Search as you type
searchInput.addEventListener("input", filterOrganizations);

// Initial load
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
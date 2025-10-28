// --- Admin Dashboard (Connected to MongoDB) ---
document.addEventListener("DOMContentLoaded", async () => {
  const API_URL = "http://localhost:3000/api/organizations"; // adjust if using users route
  let users = [];
  let filteredUsers = [];
  let currentPage = 1;
  const itemsPerPage = 10;
  let currentStatusFilter = "all";
  let currentOrgFilter = "all";
  let searchQuery = "";

  // === Fetch data from MongoDB ===
  async function fetchUsers() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      // Transform the org data into your expected "user-like" format
      users = data.map(org => ({
        name: org.name || "N/A",
        email: org.email || "N/A",
        org: org.school || "N/A",
        status: org.status?.toLowerCase() || "inactive",
        joined: org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "—",
        lastActive: org.updatedAt ? new Date(org.updatedAt).toLocaleDateString() : "—"
      }));

      filteredUsers = [...users];
      console.log("✅ Loaded users from MongoDB:", users.length);

      updateAnalytics();
      renderTable();
      setupEventListeners();
    } catch (err) {
      console.error("❌ Failed to fetch users:", err);
    }
  }

  // === Analytics ===
  function updateAnalytics() {
    const activeCount = users.filter(u => u.status === "active").length;
    const inactiveCount = users.filter(u => u.status === "inactive").length;
    const orgs = new Set(users.map(u => u.org)).size;

    document.getElementById("totalUsers").textContent = users.length.toLocaleString();
    document.getElementById("activeUsers").textContent = activeCount.toLocaleString();
    document.getElementById("inactiveUsers").textContent = inactiveCount.toLocaleString();
    document.getElementById("totalOrgs").textContent = orgs;
  }

 
  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    filteredData = [...organizations];
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  // === Filtering ===
  function filterUsers() {
    filteredUsers = users.filter(user => {
      const matchesStatus = currentStatusFilter === "all" || user.status === currentStatusFilter;
      const matchesOrg = currentOrgFilter === "all" || user.org === currentOrgFilter;
      const matchesSearch =
        searchQuery === "" ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesOrg && matchesSearch;
    });
    currentPage = 1;
    renderTable();
  }

  // === Render Table ===
  function renderTable() {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) return;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageUsers = filteredUsers.slice(start, end);

    tableBody.innerHTML = pageUsers.map(user => `
      <tr>
        <td class="font-medium">${user.name}</td>
        <td class="text-gray-500">${user.email}</td>
        <td class="text-gray-700">${user.org}</td>
        <td><span class="status-badge status-${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
        <td class="text-gray-500">${user.joined}</td>
        <td class="text-gray-500">${user.lastActive}</td>
      </tr>
    `).join('');

    document.getElementById("showingCount").textContent = Math.min(end, filteredUsers.length);
    document.getElementById("totalCount").textContent = filteredUsers.length;

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    if (prevBtn && nextBtn) {
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = end >= filteredUsers.length;
    }
  }

  // === Event Listeners ===
  function setupEventListeners() {
    document.querySelectorAll("[data-filter]").forEach(btn => {
      btn.addEventListener("click", e => {
        document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        currentStatusFilter = e.target.dataset.filter;
        filterUsers();
      });
    });

    document.querySelectorAll("[data-org]").forEach(btn => {
      btn.addEventListener("click", e => {
        document.querySelectorAll("[data-org]").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        currentOrgFilter = e.target.dataset.org;
        filterUsers();
      });
    });

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", e => {
        searchQuery = e.target.value;
        filterUsers();
      });

     // === 🔽 Universal Dropdown Logic (for all schools) ===
document.querySelectorAll('.dropdown-toggle').forEach(btn => {
  const dropdownMenu = btn.nextElementSibling;

  // Toggle dropdown visibility
  btn.addEventListener('click', e => {
    e.stopPropagation();

    // Close any other open dropdowns first
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      if (menu !== dropdownMenu) menu.classList.add('hidden');
    });

    dropdownMenu.classList.toggle('hidden');
  });

  // Handle clicks on dropdown items
  dropdownMenu.querySelectorAll('.filter-btn').forEach(item => {
    item.addEventListener('click', () => {
      const org = item.dataset.org;
      console.log("Filtering organization:", org);
      currentOrgFilter = org;
      filterUsers();
      dropdownMenu.classList.add('hidden');
    });
  });
});

// Hide dropdown when clicking anywhere else
window.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
});

    }

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    if (prevBtn && nextBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable();
        }
      });
      nextBtn.addEventListener("click", () => {
        if (currentPage * itemsPerPage < filteredUsers.length) {
          currentPage++;
          renderTable();
        }
      });
    }
  }

  // === Initialize ===
  await fetchUsers();
});

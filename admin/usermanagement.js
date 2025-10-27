// usermanagement.js

document.addEventListener("DOMContentLoaded", () => {
  const apiBase = "http://localhost:3000/api/organizations";

  const orgTableBody = document.getElementById("orgTableBody");
  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");
  const schoolFilter = document.getElementById("schoolFilter");
  const statusFilter = document.getElementById("statusFilter");
  const rowsPerPageSelect = document.getElementById("rowsPerPage");
  const paginationDiv = document.getElementById("pagination");
  const curYear = document.getElementById("curYear");

  let organizations = [];
  let filteredData = [];
  let currentPage = 1;
  let rowsPerPage = parseInt(rowsPerPageSelect.value);

  curYear.textContent = new Date().getFullYear();

  // ✅ Fetch all organizations from backend
  async function fetchOrganizations() {
    try {
      const response = await fetch(apiBase);
      const data = await response.json();
      organizations = data;
      filteredData = [...organizations];
      renderTable();
      renderPagination();
    } catch (err) {
      console.error("❌ Error fetching organizations:", err);
      orgTableBody.innerHTML = `<tr><td colspan="10">Error loading data.</td></tr>`;
    }
  }

  // ✅ Render table rows
  function renderTable() {
    orgTableBody.innerHTML = "";
    if (!filteredData.length) {
      orgTableBody.innerHTML = `<tr><td colspan="10">No organizations found.</td></tr>`;
      return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);

    pageData.forEach((org) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td><input type="checkbox" /></td>
        <td><img src="${org.logoUrl || "../Images/default-logo.png"}" alt="${org.name}" class="org-logo"></td>
        <td>${org.name || "N/A"}</td>
        <td>${org.email || "N/A"}</td>
        <td><span class="status ${org.status?.toLowerCase() || "inactive"}">${org.status || "Unknown"}</span></td>
        <td>${org.isWhitelisted ? "Organization" : "Pending"}</td>
        <td>${org.school || "N/A"}</td>
        <td>${org.programs ? org.programs.join(", ") : "N/A"}</td>
        <td>${org.updatedAt ? new Date(org.updatedAt).toLocaleDateString() : "—"}</td>
        <td>
          <button class="view-btn" data-id="${org._id}"><i class="fa-solid fa-eye"></i></button>
          <button class="edit-btn" data-id="${org._id}"><i class="fa-solid fa-pen"></i></button>
        </td>
      `;
      orgTableBody.appendChild(row);
    });
  }

  // ✅ Render pagination
  function renderPagination() {
    paginationDiv.innerHTML = "";
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = i === currentPage ? "active-page" : "";
      btn.addEventListener("click", () => {
        currentPage = i;
        renderTable();
        renderPagination();
      });
      paginationDiv.appendChild(btn);
    }
  }

  // ✅ Search functionality
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    filteredData = organizations.filter((org) =>
      org.name?.toLowerCase().includes(term) ||
      org.acronym?.toLowerCase().includes(term) ||
      org.email?.toLowerCase().includes(term)
    );
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  // ✅ Clear search
  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    filteredData = [...organizations];
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  // ✅ Filter by school and status
  function applyFilters() {
    filteredData = organizations.filter((org) => {
      const schoolMatch = !schoolFilter.value || org.school === schoolFilter.value;
      const statusMatch = !statusFilter.value || org.status === statusFilter.value;
      return schoolMatch && statusMatch;
    });
    currentPage = 1;
    renderTable();
    renderPagination();
  }

  schoolFilter.addEventListener("change", applyFilters);
  statusFilter.addEventListener("change", applyFilters);

  // ✅ Rows per page change
  rowsPerPageSelect.addEventListener("change", () => {
    rowsPerPage = parseInt(rowsPerPageSelect.value);
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  // ✅ Initialize
  fetchOrganizations();
});

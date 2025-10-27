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
        <td class="action-buttons">
          <img src="/Images/write.png" alt="Edit" class="action-icon edit-btn" title="Edit" data-id="${org._id}">
          <img src="/Images/delete.png" alt="Delete" class="action-icon delete-btn" title="Delete" data-id="${org._id}">
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

  // ✅ Handle edit and delete clicks (with modal)
  // ✅ Handle edit and delete clicks using the confirm modal present in the HTML
  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");

    if (editBtn || deleteBtn) {
      const isEdit = !!editBtn;
      const id = (editBtn || deleteBtn).dataset.id;
      const modal = document.getElementById("confirmModal");
      const title = document.getElementById("confirmTitle");
      const yesBtn = document.getElementById("confirmYes");
      const cancelBtn = document.getElementById("confirmCancel");

      if (!modal || !title || !yesBtn || !cancelBtn) return;

      title.textContent = isEdit
        ? "Are you sure you want to edit this organization?"
        : "Are you sure you want to delete this organization?";
      yesBtn.className = isEdit ? "confirm-btn" : "confirm-btn delete-confirm";
      modal.style.display = "block";

      yesBtn.onclick = () => {
        alert(
          isEdit
            ? `📝 Edit organization ID: ${id}`
            : `❌ Delete organization ID: ${id}`
        );
        modal.style.display = "none";
      };

      cancelBtn.onclick = () => (modal.style.display = "none");
    }
  });

  // --- Add Organization modal & Google/Create Org flows (moved from inline HTML script) ---
  const addOrgBtn = document.getElementById("addOrgBtn");
  const addOrgModal = document.getElementById("addOrgModal");
  const closeAddOrg = document.getElementById("closeAddOrg");

  if (addOrgBtn && addOrgModal && closeAddOrg) {
    addOrgBtn.onclick = () => (addOrgModal.style.display = "block");
    closeAddOrg.onclick = () => (addOrgModal.style.display = "none");
  }

  // Google Email Modal
  const googleBtn = document.getElementById("signInGoogleBtn");
  const googleModal = document.getElementById("googleEmailModal");
  const cancelGoogle = document.getElementById("cancelGoogle");
  const nextGoogle = document.getElementById("googleNext");

  if (googleBtn && googleModal) {
    googleBtn.onclick = () => {
      if (addOrgModal) addOrgModal.style.display = "none";
      googleModal.style.display = "block";
    };
  }
  if (cancelGoogle) {
    cancelGoogle.onclick = () => {
      googleModal.style.display = "none";
      if (addOrgModal) addOrgModal.style.display = "block";
    };
  }
  if (nextGoogle) {
    nextGoogle.onclick = () => {
      const emailEl = document.getElementById("orgEmailInput");
      const email = emailEl ? emailEl.value.trim() : "";
      if (!email) {
        alert("Please enter an email or username.");
        return;
      }
      alert(`Google Sign-In for: ${email} (non-functional demo)`);
      googleModal.style.display = "none";
    };
  }

  // Create Org modal
  const createAccountBtn = document.querySelector("#createAccountSection button");
  const createOrgModal = document.getElementById("createOrgModal");
  const cancelCreateOrg = document.getElementById("cancelCreateOrg");

  if (createAccountBtn && createOrgModal) {
    createAccountBtn.onclick = () => {
      if (addOrgModal) addOrgModal.style.display = "none";
      createOrgModal.style.display = "flex";
    };
  }
  if (cancelCreateOrg) {
    cancelCreateOrg.onclick = () => {
      createOrgModal.style.display = "none";
      if (addOrgModal) addOrgModal.style.display = "block";
    };
  }

  const saveOrgBtn = document.getElementById("saveOrgBtn");
  if (saveOrgBtn && createOrgModal) {
    saveOrgBtn.onclick = () => {
      alert("✅ Organization saved (non-functional demo).");
      createOrgModal.style.display = "none";
    };
  }

  // Close some modals by clicking outside
  window.onclick = (event) => {
    if (event.target === addOrgModal) addOrgModal.style.display = "none";
    if (event.target === googleModal) googleModal.style.display = "none";
    if (event.target === createOrgModal) createOrgModal.style.display = "none";
    const confirmModal = document.getElementById("confirmModal");
    if (event.target === confirmModal) confirmModal.style.display = "none";
  };

  // ✅ Initialize
  fetchOrganizations();
});

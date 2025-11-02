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

  const addOrgBtn = document.getElementById("addOrgBtn");
  const addOrgModal = document.getElementById("addOrgModal");
  const closeAddOrg = document.getElementById("closeAddOrg");
  const googleBtn = document.getElementById("signInGoogleBtn");
  const googleModal = document.getElementById("googleEmailModal");
  const cancelGoogle = document.getElementById("cancelGoogle");
  const nextGoogle = document.getElementById("googleNext");
  const createAccountBtn = document.querySelector("#createAccountSection button");
  const createOrgModal = document.getElementById("createOrgModal");
  const cancelCreateOrg = document.getElementById("cancelCreateOrg");
  const saveOrgBtn = document.getElementById("saveOrgBtn");

  const confirmModal = document.getElementById("confirmModal");
  const confirmTitle = document.getElementById("confirmTitle");
  const confirmYes = document.getElementById("confirmYes");
  const confirmCancel = document.getElementById("confirmCancel");

  const editConfirmModal = document.getElementById("editConfirmModal");
  const confirmEditYes = document.getElementById("confirmEditYes");
  const confirmEditCancel = document.getElementById("confirmEditCancel");

  let organizations = [];
  let filteredData = [];
  let currentPage = 1;
  let rowsPerPage = parseInt(rowsPerPageSelect.value);

  curYear.textContent = new Date().getFullYear();

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
        <td class="org-name">${org.name || "N/A"}</td>
        <td class="org-email">${org.email || "N/A"}</td>
        <td><span class="status org-status ${org.status?.toLowerCase() || "inactive"}">${org.status || "Unknown"}</span></td>
        <td>${org.isWhitelisted ? "Organization" : "Pending"}</td>
        <td class="org-school">${org.school || "N/A"}</td>
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

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    filteredData = organizations.filter(
      (org) =>
        org.name?.toLowerCase().includes(term) ||
        org.acronym?.toLowerCase().includes(term) ||
        org.email?.toLowerCase().includes(term)
    );
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    filteredData = [...organizations];
    currentPage = 1;
    renderTable();
    renderPagination();
  });

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
  rowsPerPageSelect.addEventListener("change", () => {
    rowsPerPage = parseInt(rowsPerPageSelect.value);
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");

    if (deleteBtn) {
      confirmTitle.textContent = "Are you sure you want to delete this organization?";
      confirmModal.style.display = "block";

      confirmYes.onclick = () => {
        alert("❌ Organization deleted (non-functional demo).");
        confirmModal.style.display = "none";
      };

      confirmCancel.onclick = () => (confirmModal.style.display = "none");
    }

    if (editBtn) {
      editConfirmModal.style.display = "flex";

      confirmEditYes.onclick = () => {
        editConfirmModal.style.display = "none";
        createOrgModal.style.display = "flex";
        createOrgModal.querySelector("h2").textContent = "Edit Organization";

        const row = editBtn.closest("tr");
        document.getElementById("orgName").value = row.querySelector(".org-name").textContent;
        document.getElementById("orgEmail").value = row.querySelector(".org-email").textContent;
        document.getElementById("orgSchool").value = row.querySelector(".org-school").textContent;
        document.getElementById("orgStatus").value = row.querySelector(".org-status").textContent.toLowerCase();
      };

      confirmEditCancel.onclick = () => (editConfirmModal.style.display = "none");
    }
  });

  if (addOrgBtn && addOrgModal && closeAddOrg) {
    addOrgBtn.onclick = () => (addOrgModal.style.display = "flex");
    closeAddOrg.onclick = () => (addOrgModal.style.display = "none");
  }

  if (googleBtn && googleModal) {
    googleBtn.onclick = () => {
      addOrgModal.style.display = "none";
      googleModal.style.display = "flex";
    };
  }

  if (cancelGoogle) {
    cancelGoogle.onclick = () => {
      googleModal.style.display = "none";
      addOrgModal.style.display = "flex";
    };
  }

  if (nextGoogle) {
    nextGoogle.onclick = () => {
      alert("✅ Google email submitted (non-functional demo).");
      googleModal.style.display = "none";
    };
  }

  if (createAccountBtn && createOrgModal) {
    createAccountBtn.onclick = () => {
      addOrgModal.style.display = "none";
      createOrgModal.style.display = "flex";
    };
  }

  if (cancelCreateOrg) {
    cancelCreateOrg.onclick = () => {
      createOrgModal.style.display = "none";
      addOrgModal.style.display = "flex";
    };
  }

  if (saveOrgBtn) {
    saveOrgBtn.onclick = () => {
      alert("✅ Organization saved (non-functional demo).");
      createOrgModal.style.display = "none";
    };
  }

  window.addEventListener("click", (event) => {
    const modals = [addOrgModal, googleModal, createOrgModal, confirmModal, editConfirmModal];
    modals.forEach(modal => {
      if (modal && event.target === modal) {
        modal.style.display = "none";
      }
    });
  });

  [
    addOrgModal,
    googleModal,
    createOrgModal,
    confirmModal,
    editConfirmModal
  ].forEach(modal => {
    if (modal) modal.style.display = "none";
  });

  fetchOrganizations();
});

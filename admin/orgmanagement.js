document.addEventListener("DOMContentLoaded", () => {
  // Immediately hide all modals
  const allModals = document.querySelectorAll('.modal, .createorg-modal');
  allModals.forEach(modal => {
    modal.style.display = 'none';
  });

  const orgTableBody = document.getElementById("orgTableBody");
  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");
  const filterToggle = document.getElementById("filterToggle");
  const filterMenu = document.getElementById("filterMenu");
  const rowsPerPageSelect = document.getElementById("rowsPerPage");
  const paginationDiv = document.getElementById("pagination");
  const curYear = document.getElementById("curYear");
  const orgCardList = document.getElementById("orgCardList");

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
  const createOrgForm = document.getElementById("createOrgForm"); // Add this line

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
  let currentViewport = isMobile() ? 'mobile' : 'desktop';
  let orgToDelete = null;
  let orgToEdit = null;

  curYear.textContent = new Date().getFullYear();

  // Check for viewport changes periodically (for DevTools)
  function checkViewportChange() {
    const nowMobile = isMobile();
    const nowViewport = nowMobile ? 'mobile' : 'desktop';
    
    if (nowViewport !== currentViewport) {
      currentViewport = nowViewport;
      console.log('Viewport changed to:', currentViewport);
      renderTable();
      renderPagination();
    }
  }

  // Check every 500ms for viewport changes
  setInterval(checkViewportChange, 500);

  // Also check when DevTools might be opened/closed
  window.addEventListener('resize', () => {
    checkViewportChange();
  });

  async function fetchOrganizations() {
    try {
      const apiBase = "../dataFetch/fetchDatabase.php";
      console.log('Fetching organizations from:', apiBase);
      const response = await fetch(apiBase);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Fetched data:', data);
      organizations = data;
      filteredData = [...organizations];
      renderTable();
      renderPagination();
    } catch (err) {
      console.error("Error fetching organizations:", err);
      orgTableBody.innerHTML = `<tr><td colspan="6">Error loading data. Please make sure the server is running at ${apiBase}</td></tr>`;
      return [];
    }
  }

  // Utility: detect mobile screen
  function isMobile() {
    return window.innerWidth <= 768;
  }

  // Render organization cards for mobile
  function renderCards() {
    console.log('Rendering cards...');
    if (!orgCardList) {
      console.error('orgCardList element not found!');
      return;
    }
    
    orgCardList.innerHTML = "";
    if (!filteredData.length) {
      orgCardList.innerHTML = `<div style='text-align:center;color:#888;padding:20px;'>No organizations found.</div>`;
      return;
    }
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);
    pageData.forEach(org => {
      const card = document.createElement("div");
      card.className = "card-item";
      card.innerHTML = `
        <div class="card-header">
          <img src="${org.logoUrl || '../Images/default-logo.png'}" alt="${org.name}" class="card-logo" />
          <div>
            <div class="card-title">${org.name || 'N/A'}</div>
            <div class="card-email">${org.email || 'N/A'}</div>
          </div>
        </div>
        <div class="card-meta">
          <span>${org.isWhitelisted ? 'Organization' : 'Pending'}</span>
          <span>${org.school || 'N/A'}</span>
        </div>
        <div class="card-actions">
          <button class="action-icon edit-btn" data-id="${org._id}" title="Edit" onclick="openEditModal('${org._id}')"><i class="fas fa-edit"></i></button>
          <button class="action-icon delete-btn" data-id="${org._id}" title="Delete" onclick="openDeleteModal('${org._id}')"><i class="fas fa-trash"></i></button>
        </div>
      `;
      orgCardList.appendChild(card);
    });
  }

  // Patch renderTable to also call renderCards on mobile
  function renderTable() {
    console.log('Rendering table, isMobile:', isMobile());
    
    // First, ensure proper display states
    const tableContainer = orgTableBody.closest('table');
    if (tableContainer) {
      tableContainer.style.display = isMobile() ? 'none' : '';
    }
    
    if (orgCardList) {
      orgCardList.style.display = isMobile() ? 'flex' : 'none';
    }

    orgTableBody.innerHTML = "";
    if (!filteredData.length) {
      orgTableBody.innerHTML = `<tr><td colspan="6">No organizations found.</td></tr>`;
      if (orgCardList) {
        orgCardList.innerHTML = `<div style='text-align:center;color:#888;padding:20px;'>No organizations found.</div>`;
      }
      return;
    }
    
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);
    pageData.forEach((org) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><img src="${org.logoUrl || "../Images/default-logo.png"}" alt="${org.name}" class="org-logo"></td>
        <td class="org-name">${org.name || "N/A"}</td>
        <td class="org-email">${org.email || "N/A"}</td>
        <td>${org.isWhitelisted ? "Organization" : "Pending"}</td>
        <td class="org-school">${org.school || "N/A"}</td>
        <td class="action-buttons">
          <button class="action-icon edit-btn" data-id="${org._id}" onclick="openEditModal('${org._id}')"><i class="fas fa-edit"></i></button>
          <button class="action-icon delete-btn" data-id="${org._id}" onclick="openDeleteModal('${org._id}')"><i class="fas fa-trash"></i></button>
        </td>
      `;
      orgTableBody.appendChild(row);
    });
    
    if (isMobile()) {
      renderCards();
    }
  }

  function renderPagination() {
    const pageNumbers = document.querySelector('.page-numbers');
    const prevBtn = document.querySelector('.pagination-btn.prev');
    const nextBtn = document.querySelector('.pagination-btn.next');
    
    if (!pageNumbers || !prevBtn || !nextBtn) return;
    
    pageNumbers.innerHTML = "";
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    
    if (totalPages <= 1) {
      prevBtn.style.visibility = 'hidden';
      nextBtn.style.visibility = 'hidden';
      return;
    }

    prevBtn.style.visibility = 'visible';
    nextBtn.style.visibility = 'visible';
    
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
        renderPagination();
      }
    });
    
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
        renderPagination();
      }
    });

    const maxVisiblePages = 10;
    let startPage = Math.max(1, Math.min(currentPage - Math.floor(maxVisiblePages / 2), totalPages - maxVisiblePages + 1));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = i === currentPage ? "active-page" : "";
      btn.addEventListener("click", () => {
        currentPage = i;
        renderTable();
        renderPagination();
      });
      pageNumbers.appendChild(btn);
    }
  }

  // Edit modal functions
  function openEditModal(orgId) {
    orgToEdit = orgId;
    const org = organizations.find(o => o._id === orgId);
    if (!org) return;

    if (createOrgModal) {
      createOrgModal.style.display = "flex";
      const titleElement = createOrgModal.querySelector("h2");
      if (titleElement) {
        titleElement.textContent = "Edit Organization";
      }

      // Fill in the form with organization data
      const nameField = document.getElementById("orgName");
      const acronymField = document.getElementById("orgAcronym");
      const emailField = document.getElementById("orgEmail");
      const schoolField = document.getElementById("orgSchool");
      const logoField = document.getElementById("orgLogo");

      if (nameField) nameField.value = org.name || "";
      if (acronymField) acronymField.value = org.acronym || "";
      if (emailField) emailField.value = org.email || "";
      if (schoolField) schoolField.value = org.school || "";
      if (logoField) logoField.value = org.logoUrl || "";
    }
  }

  function closeEditModal() {
    if (createOrgModal) {
      createOrgModal.style.display = "none";
    }
    orgToEdit = null;
    // Reset the form
    if (createOrgForm) createOrgForm.reset();
  }

  // Delete modal functions
  function openDeleteModal(orgId) {
    orgToDelete = orgId;
    confirmModal.style.display = "flex";
    confirmTitle.textContent = "Are you sure you want to delete this organization?";
  }

  function closeDeleteModal() {
    confirmModal.style.display = "none";
    orgToDelete = null;
  }

  // Add new organization (temporary - only updates UI)
  function addOrganization(orgData) {
    // Add new organization to local array with temporary ID
    orgData._id = 'temp_' + Date.now();
    orgData.isWhitelisted = true; // Default to organization status
    organizations.unshift(orgData); // Add to beginning of array
    // Update the filtered data and UI
    filteredData = [...organizations];
    renderTable();
    renderPagination();
  }

  // Edit organization (temporary - only updates UI)
  function editOrganization(orgData) {
    if (!orgToEdit) return;
    
    // Edit existing organization in local array
    const orgIndex = organizations.findIndex(o => o._id === orgToEdit);
    if (orgIndex !== -1) {
      organizations[orgIndex] = { ...organizations[orgIndex], ...orgData };
      // Update the filtered data and UI
      filteredData = [...organizations];
      renderTable();
      renderPagination();
    }
  }

  // Delete organization (temporary - only updates UI)
  function confirmDelete() {
    if (!orgToDelete) return;
    
    // Find the organization to "delete" in the local array
    const orgIndex = organizations.findIndex(o => o._id === orgToDelete);
    if (orgIndex !== -1) {
      // Temporarily remove from local array only
      organizations.splice(orgIndex, 1);
      // Update the filtered data and UI
      filteredData = [...organizations];
      renderTable();
      renderPagination();
      closeDeleteModal();
    }
  }

  // Get form data manually (fix for the FormData error)
  function getFormData() {
    const nameField = document.getElementById("orgName");
    const acronymField = document.getElementById("orgAcronym");
    const emailField = document.getElementById("orgEmail");
    const schoolField = document.getElementById("orgSchool");
    const logoField = document.getElementById("orgLogo");

    return {
      name: nameField ? nameField.value : "",
      acronym: acronymField ? acronymField.value : "",
      email: emailField ? emailField.value : "",
      school: schoolField ? schoolField.value : "",
      logoUrl: logoField ? logoField.value : ""
    };
  }

  // Handle form submission for both add and edit
  function handleOrgSubmit() {
    const orgData = getFormData();
    
    if (orgToEdit) {
      // Edit existing organization
      editOrganization(orgData);
    } else {
      // Add new organization
      addOrganization(orgData);
    }
    
    closeEditModal();
  }

  // Open modal for adding new organization
  function openAddModal() {
    orgToEdit = null;
    if (createOrgModal) {
      createOrgModal.style.display = "flex";
      const titleElement = createOrgModal.querySelector("h2");
      if (titleElement) {
        titleElement.textContent = "Create New Organization";
      }
      // Reset the form
      if (createOrgForm) createOrgForm.reset();
    }
  }

  // Update the existing delete button handler to use the new modal system
  document.addEventListener("click", (e) => {
    // Remove old edit button handler since we're using onclick attributes now
  });

  // Update the existing confirm modal handlers to use the new delete system
  if (confirmYes) {
    confirmYes.onclick = confirmDelete;
  }

  if (confirmCancel) {
    confirmCancel.onclick = closeDeleteModal;
  }

  // Update save organization button to use new form handler
  if (saveOrgBtn) {
    saveOrgBtn.onclick = handleOrgSubmit;
  }

  // Update create account button to open add modal directly
  if (createAccountBtn) {
    createAccountBtn.addEventListener('click', () => {
      if (addOrgModal) addOrgModal.style.display = "none";
      openAddModal();
    });
  }

  // Add form submit event listener to handle Enter key submissions
  if (createOrgForm) {
    createOrgForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleOrgSubmit();
    });
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

  // Filter Menu Toggle
  if (filterToggle && filterMenu) {
    filterToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      filterMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!filterMenu.contains(e.target) && !filterToggle.contains(e.target)) {
        filterMenu.classList.add("hidden");
      }
    });
  }

  // Filter by School
  document.querySelectorAll(".filter-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const school = btn.dataset.filter;
      filteredData = organizations.filter(org => org.school === school);
      currentPage = 1;
      renderTable();
      renderPagination();
      filterMenu.classList.add("hidden");
    });
  });

  // Clear Filters
  document.getElementById("clearFilterBtn")?.addEventListener("click", () => {
    filteredData = [...organizations];
    currentPage = 1;
    renderTable();
    renderPagination();
    filterMenu.classList.add("hidden");
  });

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    filteredData = [...organizations];
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  rowsPerPageSelect.addEventListener("change", () => {
    rowsPerPage = parseInt(rowsPerPageSelect.value);
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  // Add Organization button and modal handling
  if (addOrgBtn && addOrgModal) {
    addOrgBtn.addEventListener('click', () => {
      addOrgModal.style.display = "flex";
    });

    if (closeAddOrg) {
      closeAddOrg.addEventListener('click', () => {
        addOrgModal.style.display = "none";
      });
    }

    addOrgModal.addEventListener('click', (e) => {
      if (e.target === addOrgModal) {
        addOrgModal.style.display = "none";
      }
    });
  }

  // Google sign-in button handler
  if (googleBtn && googleModal) {
    googleBtn.addEventListener('click', () => {
      if (addOrgModal) addOrgModal.style.display = "none";
      googleModal.style.display = "flex";
    });
  }

  // Google modal cancel button
  if (cancelGoogle) {
    cancelGoogle.addEventListener('click', () => {
      if (googleModal) googleModal.style.display = "none";
      if (addOrgModal) addOrgModal.style.display = "flex";
    });
  }

  // Google modal next button
  if (nextGoogle) {
    nextGoogle.addEventListener('click', () => {
      alert("Google email submitted.");
      if (googleModal) googleModal.style.display = "none";
    });
  }

  // Create Organization modal cancel button
  if (cancelCreateOrg) {
    cancelCreateOrg.addEventListener('click', () => {
      closeEditModal();
      if (addOrgModal) addOrgModal.style.display = "flex";
    });
  }

  window.addEventListener("click", (event) => {
    const modals = [addOrgModal, googleModal, createOrgModal, confirmModal, editConfirmModal];
    modals.forEach(modal => {
      if (modal && event.target === modal) {
        modal.style.display = "none";
        if (modal === createOrgModal) {
          orgToEdit = null;
          if (createOrgForm) createOrgForm.reset();
        }
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

  // Make functions globally available for onclick attributes
  window.openDeleteModal = openDeleteModal;
  window.confirmDelete = confirmDelete;
  window.closeDeleteModal = closeDeleteModal;
  window.openEditModal = openEditModal;
  window.openAddModal = openAddModal;
  window.closeEditModal = closeEditModal;

  // Initial render to set up the correct view
  renderTable();
  fetchOrganizations();
});
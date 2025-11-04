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

  function renderTable() {
    orgTableBody.innerHTML = "";
    if (!filteredData.length) {
      orgTableBody.innerHTML = `<tr><td colspan="6">No organizations found.</td></tr>`;
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
          <button class="action-icon edit-btn" data-id="${org._id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-icon delete-btn" data-id="${org._id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      orgTableBody.appendChild(row);
    });
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
    
    // Previous button
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
        renderPagination();
      }
    });
    
    // Next button
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
        renderPagination();
      }
    });

    // Add page numbers
    const maxVisiblePages = 10;  // Show 10 pages at a time
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

    // Close filter menu when clicking outside
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

  // Removed old filter functions as we're using the new filter system
  rowsPerPageSelect.addEventListener("change", () => {
    rowsPerPage = parseInt(rowsPerPageSelect.value);
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  // Handle edit and delete button clicks
  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");

    if (editBtn) {
      const orgId = editBtn.dataset.id;
      const org = organizations.find(o => o._id === orgId);
      if (!org) return;

      if (editConfirmModal) {
        editConfirmModal.style.display = "flex";

        // Setup edit confirmation handlers
        if (confirmEditYes) {
          confirmEditYes.onclick = () => {
            editConfirmModal.style.display = "none";
            if (createOrgModal) {
              createOrgModal.style.display = "flex";
              const titleElement = createOrgModal.querySelector("h2");
              if (titleElement) {
                titleElement.textContent = "Edit Organization";
              }

              // Fill in the form with organization data
              const nameField = document.getElementById("orgName");
              const emailField = document.getElementById("orgEmail");
              const schoolField = document.getElementById("orgSchool");

              if (nameField) nameField.value = org.name || "";
              if (emailField) emailField.value = org.email || "";
              if (schoolField) schoolField.value = org.school || "";
            }
          };
        }

        if (confirmEditCancel) {
          confirmEditCancel.onclick = () => {
            editConfirmModal.style.display = "none";
          };
        }
      }
    }

    if (deleteBtn) {
      const orgId = deleteBtn.dataset.id;
      const org = organizations.find(o => o._id === orgId);
      if (!org) return;

      if (confirmModal && confirmTitle) {
        confirmTitle.textContent = "Are you sure you want to delete this organization?";
        confirmModal.style.display = "flex";

        // Setup confirmation handlers
        if (confirmYes) {
          confirmYes.onclick = () => {
            // TODO: Add actual delete logic here
            alert("Organization deleted.");
            confirmModal.style.display = "none";
          };
        }

        if (confirmCancel) {
          confirmCancel.onclick = () => {
            confirmModal.style.display = "none";
          };
        }
      }
    }
  });

  // Add Organization button and modal handling
  if (addOrgBtn && addOrgModal) {
    // Show Add Organization modal
    addOrgBtn.addEventListener('click', () => {
      addOrgModal.style.display = "flex";
    });

    // Close button handler
    if (closeAddOrg) {
      closeAddOrg.addEventListener('click', () => {
        addOrgModal.style.display = "none";
      });
    }

    // Close when clicking outside
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

  // Create Account button handler
  if (createAccountBtn && createOrgModal) {
    createAccountBtn.addEventListener('click', () => {
      if (addOrgModal) addOrgModal.style.display = "none";
      createOrgModal.style.display = "flex";
    });
  }

  // Create Organization modal cancel button
  if (cancelCreateOrg) {
    cancelCreateOrg.addEventListener('click', () => {
      if (createOrgModal) createOrgModal.style.display = "none";
      if (addOrgModal) addOrgModal.style.display = "flex";
    });
  }

  // Save Organization button
  if (saveOrgBtn) {
    saveOrgBtn.addEventListener('click', () => {
      alert("Organization saved.");
      if (createOrgModal) createOrgModal.style.display = "none";
    });
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

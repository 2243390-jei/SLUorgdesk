document.addEventListener("DOMContentLoaded", () => {
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
  const curYear = document.getElementById("curYear");
  const orgCardList = document.getElementById("orgCardList");

  const addOrgBtn = document.getElementById("addOrgBtn");
  const addOrgModal = document.getElementById("addOrgModal");
  const cancelCreateOrg = document.getElementById("cancelCreateOrg");
  const createOrgForm = document.getElementById("createOrgForm");
  const orgFormTitle = document.getElementById("orgFormTitle");

  // helper to toggle clear button visibility
  function updateClearVisibility() {
    const wrapper = document.querySelector('.search-wrap');
    if (!wrapper || !searchInput) return;
    if (searchInput.value && searchInput.value.trim() !== '') wrapper.classList.add('has-value');
    else wrapper.classList.remove('has-value');
  }

  const confirmModal = document.getElementById("confirmModal");
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

  if (curYear) {
    curYear.textContent = new Date().getFullYear();
  }

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

  setInterval(checkViewportChange, 500);

  window.addEventListener('resize', () => {
    checkViewportChange();
  });

  async function fetchOrganizations() {
    try {
      const apiBase = API_CONFIG.organizationsEndpoint;
      const response = await fetch(apiBase);
      const result = await response.json();
      organizations = result.success && result.data ? result.data : [];
      filteredData = [...organizations];
      renderTable();
      renderPagination();
    } catch (err) {
      console.error("Error fetching organizations:", err);
      orgTableBody.innerHTML = `<tr><td colspan="6">Error loading data. Please make sure the Node.js server is running at ${API_CONFIG.apiBase}</td></tr>`;
      return [];
    }
  }

  // Utility: detect mobile screen
  function isMobile() {
    return window.innerWidth <= 768;
  }

  // Render organization cards for mobile
  function renderCards() {
    if (!orgCardList) return;
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
      const imgSrc = org.localLogoPath || '../images/user.png';
      card.innerHTML = `
        <div class="card-header">
          <img src="${imgSrc}" alt="${org.name || ''}" class="card-logo" />
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

  // Replace renderTable with the full updateTable-style flow from usermanagement
  function renderTable() {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedOrgs = filteredData.slice(start, end);

    orgTableBody.innerHTML = paginatedOrgs.map(org => {
      const imgSrc = org.localLogoPath || "../images/user.png";
      return `
      <tr>
        <td><img src="${imgSrc}" alt="${org.name || ''}" class="org-logo"></td>
        <td class="org-name">${org.name || "N/A"}</td>
        <td class="org-email">${org.email || "N/A"}</td>
        <td>${org.isWhitelisted ? "Organization" : "Pending"}</td>
        <td class="org-school">${org.school || "N/A"}</td>
        <td class="action-buttons">
          <button class="action-icon edit-btn" data-id="${org._id}" onclick="openEditModal('${org._id}')"><i class="fas fa-edit"></i></button>
          <button class="action-icon delete-btn" data-id="${org._id}" onclick="openDeleteModal('${org._id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
      `;
    }).join('');

    if (!orgCardList) return;

    if (isMobile()) {
      orgCardList.style.display = 'flex';
      if (orgTableBody.parentElement && orgTableBody.parentElement.parentElement) {
        orgTableBody.parentElement.parentElement.style.display = 'none';
      }
      renderCards();
    } else {
      orgCardList.style.display = 'none';
      if (orgTableBody.parentElement && orgTableBody.parentElement.parentElement) {
        orgTableBody.parentElement.parentElement.style.display = '';
      }
    }

    updatePagination(totalPages);
  }

  // Provide an adapter so the copied pagination functions can call into the
  // existing renderTable/renderPagination flow.
  function updateTable() {
    renderTable();
  }

  // Exact pagination function copied from usermanagement.js
  function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    let html = '';

    if (totalPages > 1) {
        html += `<button onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''}>«</button>`;
        html += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                html += `<button onclick="changePage(${i})" class="${currentPage === i ? 'active-page' : ''}">${i}</button>`;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                html += '<span>...</span>';
            }
        }

        html += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
        html += `<button onclick="changePage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>»</button>`;
    }

    pagination.innerHTML = html;
  }

  // Exact function copied from usermanagement.js (uses updateTable adapter)
  function changePage(page) {
    currentPage = page;
    updateTable();
  }

  // Expose changePage globally so inline onclick handlers work
  window.changePage = changePage;

  // Exact handler copied from usermanagement.js
  function handleRowsPerPageChange(event) {
    rowsPerPage = parseInt(event.target.value);
    currentPage = 1;
    updateTable();
  }

  // Wrapper to keep existing call sites working — computes totalPages then
  // delegates to the copied updatePagination function.
  function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    updatePagination(totalPages);
  }

  // Get form data (including file input)
  function getFormData() {
    const name = document.getElementById("orgName")?.value || "";
    const acronym = document.getElementById("orgAcronym")?.value || "";
    const email = document.getElementById("orgEmail")?.value || "";
    const school = document.getElementById("orgSchool")?.value || "";
    const logoInput = document.getElementById("orgLogo");
    const logoFile = logoInput && logoInput.files && logoInput.files[0] ? logoInput.files[0] : null;
    const existingLogoPath = document.getElementById("orgLogoPath")?.value || "";
    return { name, acronym, email, school, logoFile, existingLogoPath };
  }

  // Upload logo file to Node upload endpoint, returns relative path (e.g. "../images/orgs/uuid.jpg")
  async function uploadLogoFile(file) {
    // Prefer API_CONFIG if your config.js provides an upload/base URL:
    // e.g. API_CONFIG.baseUrl = "http://192.168.1.117:5000"
    const base = (typeof API_CONFIG !== 'undefined' && (API_CONFIG.baseUrl || API_CONFIG.apiBase)) ? (API_CONFIG.baseUrl || API_CONFIG.apiBase) : null;

    // Fallback: try localhost:5000 (adjust port to your node server port)
    const fallbackHost = 'http://localhost:5000';

    // Build candidate URLs and try them in order until one returns valid JSON
    const candidates = [];
    if (base) candidates.push(`${base.replace(/\/$/, '')}/api/upload_logo`);
    candidates.push(`${fallbackHost.replace(/\/$/, '')}/api/upload_logo`);
    // also try relative to current origin (may hit Apache - will likely fail but included)
    candidates.push('/api/upload_logo');

    let lastErr = null;
    for (const url of candidates) {
      try {
        const form = new FormData();
        form.append('orgLogo', file);

        const resp = await fetch(url, {
          method: 'POST',
          body: form,
          // Do not set Content-Type; browser will add multipart/form-data boundary
        });

        const text = await resp.text();

        // Try to parse JSON; if HTML returned this will throw and go to catch
        const json = JSON.parse(text);
        if (!json || !json.success) {
          throw new Error(json && json.error ? json.error : 'Upload failed or returned success=false');
        }
        return json.filePath; // success
      } catch (err) {
        lastErr = err;
        // continue to next candidate
        console.warn(`uploadLogoFile: ${url} failed:`, err);
      }
    }

    // If we reach here, none of the endpoints worked
    throw new Error(`Upload failed: ${lastErr && lastErr.message ? lastErr.message : 'unknown error'}`);
  }

  // Handle form submission for both add and edit (uploads logo first)
  async function handleOrgSubmit() {
    const form = getFormData();

    let logoUrl = form.existingLogoPath || "";
    if (form.logoFile) {
      try {
        logoUrl = await uploadLogoFile(form.logoFile);
      } catch (err) {
        console.error('Logo upload failed:', err);
        alert('Logo upload failed: ' + (err.message || ''));
        return;
      }
    }

    const orgData = {
      name: form.name,
      acronym: form.acronym,
      email: form.email,
      school: form.school,
      localLogoPath: logoUrl,
      isWhitelisted: true
    };

    if (orgToEdit) {
      await editOrganization(orgData);
    } else {
      await addOrganization(orgData);
    }

    closeEditModal();
  }

  // Add new organization - Call Node.js API
  async function addOrganization(orgData) {
    try {
      const resp = await fetch(API_CONFIG.organizationsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData)
      });
      const json = await resp.json();
      if (!json.success) {
        console.error('Add org failed:', json);
        alert('Failed to add organization.');
        return;
      }
      // refresh list
      await fetchOrganizations();
    } catch (error) {
      console.error("Error adding organization:", error);
      alert('Error adding organization.');
    }
  }

  // Edit organization - Call Node.js API
  async function editOrganization(orgData) {
    if (!orgToEdit) return;
    try {
      // include _id and multiple logo keys to match possible backend expectations
      const payload = Object.assign({}, orgData, {
        _id: orgToEdit,
        id: orgToEdit,
        logo: orgData.localLogoPath || orgData.logo || "",
      });

      const url = `${API_CONFIG.organizationsEndpoint}/${orgToEdit}`;
      console.log('Sending UPDATE to', url, 'payload:', payload);

      const resp = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await resp.text();
      let json;
      try {
        json = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.error('Edit org: response is not JSON:', text);
        alert('Update failed: server returned invalid response. See console for details.');
        return;
      }

      if (!resp.ok || !json.success) {
        console.error('Edit org failed:', resp.status, json);
        alert('Failed to update organization: ' + (json.error || json.message || JSON.stringify(json)));
        return;
      }

      // success - refresh list and reset edit state
      await fetchOrganizations();
      orgToEdit = null;
      closeEditModal();
      // optional non-blocking notice
      console.log('Organization updated:', json.data || json);
    } catch (error) {
      console.error("Error editing organization:", error);
      alert('Error editing organization: ' + (error.message || error));
    }
  }

  // Open "Add Organization" modal
  function openAddModal() {
    orgToEdit = null;
    if (orgFormTitle) orgFormTitle.textContent = "Add Organization";
    if (createOrgForm) createOrgForm.reset();
    const logoPathField = document.getElementById("orgLogoPath");
    if (logoPathField) logoPathField.value = "";
    if (addOrgModal) addOrgModal.style.display = "flex";
  }

  // Edit modal functions (ensure we store existing logo path in hidden field)
  function openEditModal(orgId) {
    orgToEdit = orgId;
    const org = organizations.find(o => o._id === orgId);
    if (!org) return;

    if (addOrgModal) {
      if (orgFormTitle) orgFormTitle.textContent = "Edit Organization";

      const nameField = document.getElementById("orgName");
      const acronymField = document.getElementById("orgAcronym");
      const emailField = document.getElementById("orgEmail");
      const schoolField = document.getElementById("orgSchool"); // now a select
      const logoFileField = document.getElementById("orgLogo");
      const logoPathField = document.getElementById("orgLogoPath"); // hidden input

      if (nameField) nameField.value = org.name || "";
      if (acronymField) acronymField.value = org.acronym || "";
      if (emailField) emailField.value = org.email || "";
      // set select value safely (if not in list, set to empty)
      if (schoolField) {
        if (org.school && [...schoolField.options].some(o => o.value === org.school)) {
          schoolField.value = org.school;
        } else {
          schoolField.value = "";
        }
      }
      if (logoPathField) logoPathField.value = org.localLogoPath || "";
      if (logoFileField) logoFileField.value = ""; // clear file chooser

      addOrgModal.style.display = "flex";
    }
  }

  function closeEditModal() {
    if (addOrgModal) addOrgModal.style.display = "none";
    orgToEdit = null;
    if (createOrgForm) createOrgForm.reset();
    const logoPathField = document.getElementById("orgLogoPath");
    if (logoPathField) logoPathField.value = "";
  }

  // Delete modal functions
  function openDeleteModal(orgId) {
    orgToDelete = orgId;
    confirmModal.style.display = "flex";
  }

  function closeDeleteModal() {
    confirmModal.style.display = "none";
    orgToDelete = null;
  }

  // Delete organization - Call Node.js API
  async function confirmDelete() {
    if (!orgToDelete) return;
    
    try {
      const response = await fetch(`${API_CONFIG.organizationsEndpoint}/${orgToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      if (result.success) {
        // Refresh organizations list
        organizations = await new Promise((resolve, reject) => {
          fetch(API_CONFIG.organizationsEndpoint)
            .then(res => res.json())
            .then(data => resolve(data.success ? data.data : []))
            .catch(reject);
        });
        filteredData = [...organizations];
        renderTable();
        renderPagination();
        closeDeleteModal();
        alert('Organization deleted successfully!');
      } else {
        alert('Error deleting organization: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Error: ' + error.message);
    }
  }

  // Add Organization button and modal handling
  if (addOrgBtn && addOrgModal) {
    addOrgBtn.addEventListener('click', () => {
      openAddModal();
    });
  }

  // Cancel button for organization form
  if (cancelCreateOrg) {
    cancelCreateOrg.addEventListener('click', () => {
      closeEditModal();
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
    updateClearVisibility();
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
    updateClearVisibility();
    searchInput.focus();
  });

  rowsPerPageSelect.addEventListener("change", handleRowsPerPageChange);

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    const modals = [addOrgModal, confirmModal, editConfirmModal];
    modals.forEach(modal => {
      if (modal && event.target === modal) {
        modal.style.display = "none";
        if (modal === addOrgModal) {
          orgToEdit = null;
          if (createOrgForm) createOrgForm.reset();
        }
      }
    });
  });

  // Wire delete / edit confirmation buttons
  if (confirmYes) confirmYes.addEventListener('click', confirmDelete);
  if (confirmCancel) confirmCancel.addEventListener('click', closeDeleteModal);
  if (confirmEditYes) confirmEditYes.addEventListener('click', async () => {
    if (editConfirmModal) editConfirmModal.style.display = 'none';
    await handleOrgSubmit();
  });
  if (confirmEditCancel) confirmEditCancel.addEventListener('click', () => {
    if (editConfirmModal) editConfirmModal.style.display = 'none';
  });

  // Expose changePage globally so inline onclick handlers work
  window.changePage = changePage;

  // Make functions globally available for onclick attributes
  window.openDeleteModal = openDeleteModal;
  window.confirmDelete = confirmDelete;
  window.closeDeleteModal = closeDeleteModal;
  window.openEditModal = openEditModal;
  window.openAddModal = openAddModal;
  window.closeEditModal = closeEditModal;

  // Add form submit handler
  if (createOrgForm) {
    createOrgForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      await handleOrgSubmit();
    });
  }

  // Initial render and fetch
  renderTable();
  fetchOrganizations();
});

document.addEventListener("DOMContentLoaded", async () => {
  // --- Back Button Functionality ---
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", () => {
      window.location.href = "../osas/orgs.php";
    });
  }

  // --- Get organization info from URL ---
  const urlParams = new URLSearchParams(window.location.search);
  const orgId = urlParams.get("orgId");
  const orgName = urlParams.get("orgName");

  const orgNameDisplay = document.getElementById("orgNameDisplay");
  if (orgNameDisplay && orgName) {
    orgNameDisplay.textContent = decodeURIComponent(orgName);
  }

  // --- Stop if no orgId found ---
  if (!orgId) {
    console.error("No orgId found in URL");
    document.getElementById("submissionsContainer").innerHTML = `
      <p style="color:red; padding: 20px; text-align: center;">No organization selected. Please go back to the organization list.</p>
    `;
    return;
  }

  let submissions = [];

  // --- Fetch submissions ---
  try {
    const response = await fetch(`../../php-server/routes/submissions.php?organizationId=${orgId}`);
    const result = await response.json();
    submissions = result.success ? result.data : [];
    
    // Debug: Log the submissions to see the event types
    console.log("All submissions:", submissions);
    if (submissions.length > 0) {
      console.log("Event types found:", submissions.map(sub => sub.event?.eventType));
    }
    
    renderSubmissions(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    document.getElementById("submissionsContainer").innerHTML = `
      <p style="color:red; padding: 20px; text-align: center;">Failed to load submissions. Please try again later.</p>
    `;
  }

  // ==================== FILTER SYSTEM ====================
  const filterToggle = document.getElementById("filterToggle");
  const filterDropdown = document.getElementById("filterDropdown");

  if (filterToggle && filterDropdown) {
    filterToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      filterDropdown.classList.toggle("hidden");
    });
  }

  document.addEventListener("click", (e) => {
    if (!filterDropdown) return;
    if (!filterDropdown.classList.contains("hidden")) {
      const isClickInside =
        filterDropdown.contains(e.target) ||
        (filterToggle && filterToggle.contains(e.target));
      if (!isClickInside) filterDropdown.classList.add("hidden");
    }
  });

  // Expand / Collapse
  document.querySelectorAll(".filter-category").forEach((categoryBtn) => {
    categoryBtn.addEventListener("click", () => {
      const nextEl = categoryBtn.nextElementSibling;
      if (nextEl && nextEl.classList.contains("filter-sub")) {
        nextEl.classList.toggle("hidden");
      }
    });
  });

  // Nested submenus (locations)
  document.querySelectorAll('.filter-sub[data-type="location"] [data-sub]').forEach((subBtn) => {
    subBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const parentValue = subBtn.getAttribute("data-sub");
      const subMenu = subBtn.nextElementSibling;
      if (subMenu && subMenu.dataset.parent === parentValue) {
        subMenu.classList.toggle("hidden");
      }
    });
  });

  // --- Category Filter ---
  const categoryContainer = document.querySelector('.filter-sub[data-type="category"]');
  if (categoryContainer) {
    categoryContainer.addEventListener("click", (ev) => {
      if (ev.target.tagName === "BUTTON") {
        const selectedCategory = ev.target.getAttribute("data-category");
        console.log("Category filter clicked:", selectedCategory);
        applyCategoryFilter(selectedCategory);
        filterDropdown.classList.add("hidden");
      }
    });
  }

  // --- SDG Filter ---
  const sdgContainer = document.querySelector('.filter-sub[data-type="sdg"]');
  if (sdgContainer) {
    sdgContainer.addEventListener("click", (ev) => {
      if (ev.target.tagName === "BUTTON") {
        const selectedFilter = ev.target.textContent.trim();
        applySDGFilter(selectedFilter);
        filterDropdown.classList.add("hidden");
      }
    });
  }

  // --- Location Filter ---
  document.querySelectorAll('.filter-sub[data-type="location"] button, .filter-sub2 button')
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const hasSub = btn.nextElementSibling && btn.nextElementSibling.classList.contains("filter-sub2");
        if (!hasSub) {
          const selectedVenue = btn.textContent.trim();
          applyVenueFilter(selectedVenue);
          filterDropdown.classList.add("hidden");
        }
      });
    });

  // --- Clear Filter ---
  const clearFilterBtn = document.getElementById("clearFilterBtn");
  if (clearFilterBtn) {
    clearFilterBtn.addEventListener("click", () => {
      document.querySelectorAll(".filter-sub, .filter-sub2").forEach((el) => el.classList.add("hidden"));
      renderSubmissions(submissions);
      filterDropdown.classList.add("hidden");
    });
  }

  // --- Search ---
  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filtered = submissions.filter((sub) => {
        const eventName = (sub.event && sub.event.eventName) || "";
        return eventName.toLowerCase().includes(query);
      });
      renderSubmissions(filtered);
    });
  }

  // ==================== FILTER LOGIC ====================
  function applyCategoryFilter(selectedCategory) {
    console.log("Applying category filter for:", selectedCategory);
    
    const filtered = submissions.filter((sub) => {
      const eventType = (sub.event && sub.event.eventType) || "";
      console.log("Checking event type:", eventType, "against category:", selectedCategory);
      
      // More flexible matching - check if event type contains the category
      return eventType.toLowerCase().includes(selectedCategory.toLowerCase());
    });
    
    console.log("Filtered results:", filtered.length);
    renderSubmissions(filtered);
  }

  function applySDGFilter(selectedFilter) {
    const normalizedFilter = normalizeText(selectedFilter);
    const filtered = submissions.filter((sub) => {
      const sdgs = (sub.event && sub.event.eventSDG) || [];
      return sdgs.some((sdg) => normalizeText(sdg) === normalizedFilter);
    });
    renderSubmissions(filtered);
  }

  function applyVenueFilter(selectedVenue) {
    const filtered = submissions.filter((sub) => {
      const venue = (sub.event && sub.event.eventVenue) || "";
      return venue.toLowerCase().includes(selectedVenue.toLowerCase());
    });
    renderSubmissions(filtered);
  }

  // --- RENDER SUBMISSIONS FUNCTION (Now Responsive) ---
  function renderSubmissions(submissions) {
    const container = document.getElementById("submissionsContainer");
    const isMobile = window.innerWidth <= 768;

    if (!submissions || submissions.length === 0) {
      container.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--muted);">No submissions found for this organization.</p>`;
      return;
    }

    if (isMobile) {
      renderMobileSubmissions(container, submissions);
    } else {
      renderDesktopSubmissions(container, submissions);
    }
  }

  function renderDesktopSubmissions(container, submissions) {
    let html = `
      <table class="submissions-table">
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Type</th>
            <th>Date</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Venue</th>
            <th>Attendance</th>
            <th>SDG Goals</th>
            <th>Proof</th>
            <th>Supporting Documents</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
    `;

    submissions.forEach((sub) => {
      const e = sub.event || {};
      const sdgs = e.eventSDG && e.eventSDG.length > 0 ? e.eventSDG.join(", ") : "None";
      const docs = (e.supportingDocuments || [])
        .map((d, i) => `<a href="${d}" target="_blank">File ${i + 1}</a>`)
        .join(", ");

      html += `
        <tr>
          <td>${e.eventName || "N/A"}</td>
          <td>${e.eventType || "N/A"}</td>
          <td>${e.eventDate || "N/A"}</td>
          <td>${e.startTime || "N/A"}</td>
          <td>${e.endTime || "N/A"}</td>
          <td>${e.eventVenue || "N/A"}</td>
          <td>${e.attendance || "N/A"}</td>
          <td>${sdgs}</td>
          <td>${e.eventProof ? `<a href="${e.eventProof}" target="_blank">View Proof</a>` : "N/A"}</td>
          <td>${docs || "None"}</td>
          <td><button class="view-details-btn" data-event='${JSON.stringify(e).replace(/'/g, "&#39;")}'>View Full Details</button></td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
    attachEventListeners();
  }

  function renderMobileSubmissions(container, submissions) {
    let html = '<div class="submissions-mobile">';

    submissions.forEach((sub) => {
      const e = sub.event || {};
      const sdgs = e.eventSDG && e.eventSDG.length > 0 ? e.eventSDG.join(", ") : "None";
      const docs = (e.supportingDocuments || [])
        .map((d, i) => `<a href="${d}" target="_blank">File ${i + 1}</a>`)
        .join(", ");

      html += `
        <div class="submission-card">
          <div class="card-header">
            <h3 class="event-name">${e.eventName || "N/A"}</h3>
            <span class="event-type">${e.eventType || "N/A"}</span>
          </div>
          
          <div class="card-details">
            <div class="detail-row">
              <span class="detail-label">Date & Time:</span>
              <span class="detail-value">${e.eventDate || "N/A"} • ${e.startTime || "N/A"} - ${e.endTime || "N/A"}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Venue:</span>
              <span class="detail-value">${e.eventVenue || "N/A"}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Attendance:</span>
              <span class="detail-value">${e.attendance || "N/A"}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">SDG Goals:</span>
              <span class="detail-value">${sdgs}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Proof:</span>
              <span class="detail-value">${e.eventProof ? `<a href="${e.eventProof}" target="_blank">View Proof</a>` : "N/A"}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Documents:</span>
              <span class="detail-value">${docs || "None"}</span>
            </div>
          </div>
          
          <button class="view-details-btn mobile-btn" data-event='${JSON.stringify(e).replace(/'/g, "&#39;")}'>
            View Full Details
          </button>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
    attachEventListeners();
  }

  function attachEventListeners() {
    document.querySelectorAll(".view-details-btn").forEach((btn, index) => {
      btn.addEventListener("click", (e) => {
        const eventData = JSON.parse(e.target.getAttribute("data-event"));
        showSubmissionModal(eventData);
      });
    });
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    renderSubmissions(submissions);
  });
});

// --- NORMALIZE TEXT ---
function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/sdg\s*/g, "")
    .replace(/[-.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// --- SHOW SUBMISSION MODAL ---
function showSubmissionModal(eventData) {
  const modal = document.getElementById("submissionModal");
  const modalBody = document.getElementById("submissionDetailsBody");
  
  if (!modal || !modalBody) return;
  
  // Build the submission details HTML
  const sdgs = eventData.eventSDG && eventData.eventSDG.length > 0 
    ? eventData.eventSDG.map(sdg => `<span class="sdg-tag">${sdg}</span>`).join('')
    : '<span class="value">None</span>';
    
  const docs = (eventData.supportingDocuments || []).length > 0
    ? `<div class="document-links">${eventData.supportingDocuments.map((doc, i) => `<a href="${doc}" target="_blank" rel="noopener noreferrer">📄 Supporting Document ${i + 1}</a>`).join('')}</div>`
    : '<span class="value">None</span>';
    
  const proofHTML = eventData.eventProof 
    ? `<a href="${eventData.eventProof}" target="_blank" rel="noopener noreferrer">View Event Proof</a>`
    : '<span class="value">No proof uploaded</span>';

  const detailsHTML = `
    <div class="submission-details-grid">
      <div class="detail-section">
        <label>Event Name</label>
        <div class="value">${eventData.eventName || 'N/A'}</div>
      </div>
      
      <div class="detail-section">
        <label>Event Type</label>
        <div class="value">${eventData.eventType || 'N/A'}</div>
      </div>
      
      <div class="detail-section">
        <label>Event Date</label>
        <div class="value">${eventData.eventDate || 'N/A'}</div>
      </div>
      
      <div class="detail-section">
        <label>Start Time</label>
        <div class="value">${eventData.startTime || 'N/A'}</div>
      </div>
      
      <div class="detail-section">
        <label>End Time</label>
        <div class="value">${eventData.endTime || 'N/A'}</div>
      </div>
      
      <div class="detail-section">
        <label>Venue</label>
        <div class="value">${eventData.eventVenue || 'N/A'}</div>
      </div>
      
      <div class="detail-section full-width">
        <label>Attendance</label>
        <div class="value">${eventData.attendance || 'N/A'}</div>
      </div>
      
      <div class="detail-section full-width">
        <label>SDG Goals</label>
        <div class="sdg-list">${sdgs}</div>
      </div>
      
      <div class="detail-section full-width">
        <label>Event Proof</label>
        <div class="value">${proofHTML}</div>
      </div>
      
      <div class="detail-section full-width">
        <label>Supporting Documents</label>
        <div class="value">${docs}</div>
      </div>
      
      ${eventData.eventDescription ? `
        <div class="detail-section full-width">
          <label>Description</label>
          <div class="value">${eventData.eventDescription}</div>
        </div>
      ` : ''}
      
      ${eventData.eventRemarks ? `
        <div class="detail-section full-width">
          <label>Remarks</label>
          <div class="value">${eventData.eventRemarks}</div>
        </div>
      ` : ''}
    </div>
  `;
  
  modalBody.innerHTML = detailsHTML;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById("submissionModalTitle").textContent = eventData.eventName || 'Submission Details';
}

// --- NAVIGATION ---
function navigateToPage(page) {
  const pages = {
    'calendar': 'calendar.php',
    'orgs': 'orgs.php',
    'analytics': 'analytics.php'
  };
  if (pages[page]) {
    window.location.href = pages[page];
  }
}

// Wire up navigation items
document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page');
      navigateToPage(page);
    });
  });

  // --- LOGOUT MODAL ---
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logoutModal.classList.add('show');
      logoutModal.setAttribute('aria-hidden', 'false');
    });
  }

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
      fetch('../../php-server/routes/logout.php')
        .then(() => {
          window.location.href = '../../index.php';
        })
        .catch(error => console.error('Logout error:', error));
    });
  }

  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener('click', () => {
      logoutModal.classList.remove('show');
      logoutModal.setAttribute('aria-hidden', 'true');
    });
  }

  // Close modal on background click
  if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
      if (e.target === logoutModal) {
        logoutModal.classList.remove('show');
        logoutModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.querySelector('.sidebar');
  if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-expanded');
    });
  }

  // --- SUBMISSION DETAILS MODAL ---
  const submissionModal = document.getElementById('submissionModal');
  const closeSubmissionModal = document.getElementById('closeSubmissionModal');
  const closeSubmissionModalBtn = document.getElementById('closeSubmissionModalBtn');

  function hideSubmissionModal() {
    if (submissionModal) {
      submissionModal.classList.remove('show');
      submissionModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (closeSubmissionModal) {
    closeSubmissionModal.addEventListener('click', hideSubmissionModal);
  }

  if (closeSubmissionModalBtn) {
    closeSubmissionModalBtn.addEventListener('click', hideSubmissionModal);
  }

  // Close submission modal on background click
  if (submissionModal) {
    submissionModal.addEventListener('click', (e) => {
      if (e.target === submissionModal) {
        hideSubmissionModal();
      }
    });
  }

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideSubmissionModal();
    }
  });
});
document.addEventListener("DOMContentLoaded", async () => {
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
      <p style="color:red;">No organization selected. Please go back to the organization list.</p>
    `;
    return;
  }

  let submissions = [];

  // --- Fetch submissions ---
  try {
    const response = await fetch(`../dataFetch/fetchSubmissions.php?orgId=${orgId}`);
    submissions = await response.json();
    renderSubmissions(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    document.getElementById("submissionsContainer").innerHTML = `
      <p style="color:red;">Failed to load submissions. Please try again later.</p>
    `;
  }

  // ==================== FILTER SYSTEM ====================

  const filterToggle = document.getElementById("filterToggle");
  const filterDropdown = document.getElementById("filterDropdown");

  // Toggle dropdown visibility
  if (filterToggle && filterDropdown) {
    filterToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      filterDropdown.classList.toggle("hidden");
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!filterDropdown) return;
    if (!filterDropdown.classList.contains("hidden")) {
      const isClickInside =
        filterDropdown.contains(e.target) ||
        (filterToggle && filterToggle.contains(e.target));
      if (!isClickInside) filterDropdown.classList.add("hidden");
    }
  });

  // --- Expand/collapse main categories ---
  document.querySelectorAll(".filter-category").forEach((categoryBtn) => {
    categoryBtn.addEventListener("click", () => {
      const nextEl = categoryBtn.nextElementSibling;
      if (nextEl && nextEl.classList.contains("filter-sub")) {
        nextEl.classList.toggle("hidden");
      }
    });
  });

  // --- Handle nested submenus (like Maryheights ▸) ---
  document.querySelectorAll('.filter-sub[data-type="location"] [data-sub]').forEach((subBtn) => {
    subBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const subMenu = subBtn.nextElementSibling;
      if (subMenu && subMenu.classList.contains("filter-sub2")) {
        subMenu.classList.toggle("hidden");
      }
    });
  });

  // --- SDG FILTER FUNCTIONALITY ---
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

  // --- LOCATION FILTER FUNCTIONALITY ---
  document.querySelectorAll('.filter-sub[data-type="location"] button, .filter-sub2 button')
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const hasSub = btn.nextElementSibling && btn.nextElementSibling.classList.contains("filter-sub2");

        // Only apply the filter if it's a final venue (no submenu)
        if (!hasSub) {
          const selectedVenue = btn.textContent.trim();
          applyVenueFilter(selectedVenue);
          filterDropdown.classList.add("hidden");
        }
      });
    });

  // --- CLEAR FILTER BUTTON ---
  const clearFilterBtn = document.getElementById("clearFilterBtn");
  if (clearFilterBtn) {
    clearFilterBtn.addEventListener("click", () => {
      document.querySelectorAll(".filter-sub, .filter-sub2").forEach((el) => el.classList.add("hidden"));
      renderSubmissions(submissions);
      filterDropdown.classList.add("hidden");
    });
  }

  // ==================== SEARCH FUNCTIONALITY ====================

  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const rows = document.querySelectorAll(".submissions-table tbody tr");

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? "" : "none";
      });
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      const rows = document.querySelectorAll(".submissions-table tbody tr");
      rows.forEach((row) => (row.style.display = ""));
    });
  }

  // ==================== FILTER LOGIC ====================

  // ✅ Fix SDG comparison between “SDG 1 - No Poverty” and “1. No Poverty”
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
});

// --- NORMALIZE TEXT FOR COMPARISON ---
function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/sdg\s*/g, "")   // remove "SDG "
    .replace(/[-.]/g, "")     // remove "-" and "."
    .replace(/\s+/g, " ")     // normalize spaces
    .trim();
}

// --- RENDER SUBMISSIONS FUNCTION ---
function renderSubmissions(submissions) {
  const container = document.getElementById("submissionsContainer");

  if (!submissions || submissions.length === 0) {
    container.innerHTML = `<p>No submissions found for this organization.</p>`;
    return;
  }

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
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

const submissionsContainer = document.getElementById("submissionsContainer");
let allSubmissions = [];

// Load All Submissions
async function loadSubmissions() {
  const params = new URLSearchParams(window.location.search);
  const orgId = params.get("orgId");
  const orgName = params.get("orgName");

  const orgNameDisplay = document.getElementById("orgNameDisplay");
  if (orgNameDisplay) {
    orgNameDisplay.textContent = orgName ? decodeURIComponent(orgName) : "Organization Unknown";
  }

  if (!orgId) {
    submissionsContainer.innerHTML = `<p>No organization selected.</p>`;
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/Submissions/${orgId}`);
    const submissions = await response.json();

    allSubmissions = submissions; // Storage for Filtering

    if (submissions.length === 0) {
      submissionsContainer.innerHTML = `<p>No submissions found for this organization.</p>`;
      return;
    }

    renderFilteredSubmissions(submissions);
  } catch (error) {
    console.error("Error loading submissions:", error);
    submissionsContainer.innerHTML = `<p>Error loading submissions.</p>`;
  }
}

// Rendering of Filter
function renderFilteredSubmissions(submissions) {
  if (!submissions || submissions.length === 0) {
    submissionsContainer.innerHTML = `<p>No submissions match your filter.</p>`;
    return;
  }

  submissionsContainer.innerHTML = "";

  submissions.forEach((s, index) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("submission-wrapper");

    wrapper.innerHTML = `
      <div class="submission-header" data-index="${index}">
        <span class="dropdown-arrow">▶</span>
        <span class="submission-title">${s.title || s.eventName || "-"}</span>
      </div>
      <div class="submission-details hidden">
        <table class="submission-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Event Date</th>
              <th>Category</th>
              <th>Event Description</th>
              <th>Location</th>
              <th>SDG Category</th>
              <th>Budget</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${s.eventName || "-"}</td>
              <td>${s.eventDate ? new Date(s.eventDate).toLocaleDateString() : "-"}</td>
              <td>${s.category || "-"}</td>
              <td>${s.EventDescription || "-"}</td>
              <td>${s.Location || "-"}</td>
              <td>${s.SDGCategory || "-"}</td>
              <td>${s.AllottedBudget || "-"}</td>
              <td>${s.status || "-"}</td>
              <td><button class="view-details-btn" data-id="${s._id}">View Details</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    submissionsContainer.appendChild(wrapper);
  });

  // Dropdown Functionality
  document.querySelectorAll(".submission-header").forEach(header => {
    header.addEventListener("click", () => {
      const index = header.dataset.index;
      const details = document.querySelectorAll(".submission-details")[index];
      const arrow = header.querySelector(".dropdown-arrow");
      details.classList.toggle("hidden");
      arrow.textContent = details.classList.contains("hidden") ? "▶" : "▼";
    });
  });

  // View Details Button Functionality
  document.querySelectorAll(".view-details-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const submissionId = btn.dataset.id;
      const params = new URLSearchParams(window.location.search);
      const orgId = params.get("orgId");
      const orgName = params.get("orgName");
      window.location.href = `submissionFullDetails.html?submissionId=${submissionId}&orgId=${encodeURIComponent(orgId)}&orgName=${encodeURIComponent(orgName)}`;
    });
  });
}


// Filter Functionality
function applyFilter(filterValue) {
  if (!filterValue || !Array.isArray(allSubmissions)) return;

  const filtered = allSubmissions.filter(s => {
    // Map numeric budget to textual range
    const budgetCategory =
      s.AllottedBudget <= 5000
        ? "PHP 1,000 - 5,000"
        : s.AllottedBudget <= 10000
        ? "PHP 5,000 - 10,000"
        : s.AllottedBudget <= 15000
        ? "PHP 10,000 - 15,000"
        : "More than PHP 15,000";

    const text = `${s.category} ${s.Location} ${s.SDGCategory} ${budgetCategory}`.toLowerCase();
    return text.includes(filterValue.toLowerCase());
  });

  renderFilteredSubmissions(filtered);
  document.querySelector(".filter-dropdown").classList.add("hidden");
}

// Filter Dropdown
document.addEventListener("DOMContentLoaded", () => {
  const filterToggle = document.getElementById("filterToggle");
  const filterDropdown = document.querySelector(".filter-dropdown");
  const categoryButtons = document.querySelectorAll(".filter-category");
  const subButtons = document.querySelectorAll(".filter-sub button");
  const sub2Buttons = document.querySelectorAll(".filter-sub2 button");

  // toggle dropdown
  if (filterToggle && filterDropdown) {
    filterToggle.addEventListener("click", () => {
      filterDropdown.classList.toggle("hidden");
    });
  }

  // toggle subcategories
  categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const next = btn.nextElementSibling;
      if (next && next.classList.contains("filter-sub")) {
        next.classList.toggle("hidden");
      }
    });
  });

  // toggle nested menus and apply filters
  subButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const next = btn.nextElementSibling;
      if (next && next.classList.contains("filter-sub2")) {
        next.classList.toggle("hidden");
      } else {
        applyFilter(btn.textContent.trim());
      }
    });
  });

  sub2Buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      applyFilter(btn.textContent.trim());
    });
  });

  // load data
  loadSubmissions();
});

document.addEventListener("DOMContentLoaded", () => {
  const clearFilterBtn = document.getElementById("clearFilterBtn");

  if (clearFilterBtn) {
    clearFilterBtn.addEventListener("click", () => {
      // Show all submissions again
      document.querySelectorAll(".submission-wrapper").forEach(wrapper => {
        wrapper.style.display = "block";
      });

      // Close dropdown after clearing
      const filterDropdown = document.querySelector(".filter-dropdown");
      if (filterDropdown) filterDropdown.classList.add("hidden");

      // Show confirmation text
      console.log("Filters cleared — all submissions visible.");
    });
  }
});

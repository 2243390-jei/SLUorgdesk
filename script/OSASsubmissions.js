// OSASsubmissions.js
const submissionsContainer = document.getElementById("submissionsContainer");

async function loadSubmissions() {
  const params = new URLSearchParams(window.location.search);
  const orgId = params.get("orgId");
  const orgName = params.get("orgName"); // Get org name from URL if available

  const headerRight = document.createElement("div");
  headerRight.classList.add("org-name-display");
  headerRight.textContent = orgName ? decodeURIComponent(orgName) : "Organization Unknown";

  const header = document.querySelector(".header");
  if (header) header.appendChild(headerRight);

  if (!orgId) {
    submissionsContainer.innerHTML = `<p>No organization selected.</p>`;
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/Submissions/${orgId}`);
    const submissions = await response.json();

    if (submissions.length === 0) {
      submissionsContainer.innerHTML = `<p>No submissions found for this organization.</p>`;
      return;
    }

    submissionsContainer.innerHTML = "";

    submissions.forEach((s, index) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("submission-wrapper");

      wrapper.innerHTML = `
        <div class="submission-header" data-index="${index}">
          <span class="dropdown-arrow">▶</span>
          <span class="submission-title">${s.title || "-"}</span>
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
                <td><button class="view-details-btn">View Details</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      submissionsContainer.appendChild(wrapper);
    });

    document.querySelectorAll(".submission-header").forEach(header => {
      header.addEventListener("click", () => {
        const index = header.dataset.index;
        const details = document.querySelectorAll(".submission-details")[index];
        const arrow = header.querySelector(".dropdown-arrow");
        details.classList.toggle("hidden");
        arrow.textContent = details.classList.contains("hidden") ? "▶" : "▼";
      });
    });

    // Button click listener
    document.querySelectorAll(".view-details-btn").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        alert(`Viewing details for: ${submissions[i].eventName || "Unknown Event"}`);
      });
    });

  } catch (error) {
    console.error("Error loading submissions:", error);
    submissionsContainer.innerHTML = `<p>Error loading submissions.</p>`;
  }
}

loadSubmissions();

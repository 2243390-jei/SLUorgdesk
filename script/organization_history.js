/* ========================================================
   organization_history.js – EVENTS ONLY EDITABLE
   Works with /api/Submissions | No logo
   ======================================================== */

// Use PHP endpoint that returns submissions JSON
const API_URL = "../dataFetch/fetchSubmissions.php";
let allSubmissions = [];
let currentEditingId = null;
const modal = document.getElementById("submissionModal");
const submissionList = document.getElementById("submissionList");
const searchInput = document.getElementById("searchInput");
const academicYearFilter = document.getElementById("academicYearFilter");
const semesterFilter = document.getElementById("semesterFilter");
const modalEditBtn = document.getElementById("modalEditBtn");

// ======================================================
// Fetch helper
// ======================================================
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// ======================================================
// Initialize
// ======================================================
async function initialize() {
  try {
    const response = await fetchWithTimeout(API_URL);
    const data = await response.json();
    allSubmissions = data;

    const uniqueAY = [...new Set(allSubmissions.map(s => s.academicYear))].filter(Boolean).sort().reverse();

    if (academicYearFilter) {
      academicYearFilter.innerHTML = `
        <option value="">All Academic Years</option>
        ${uniqueAY.map(ay => `<option value="${ay}">${ay}</option>`).join("")}
      `;
    }

    if (semesterFilter) {
      semesterFilter.innerHTML = `
        <option value="">All Semesters</option>
        <option value="1st Semester">1st Semester</option>
        <option value="2nd Semester">2nd Semester</option>
      `;
    }

    academicYearFilter?.addEventListener("change", applyFilters);
    semesterFilter?.addEventListener("change", applyFilters);
    searchInput?.addEventListener("input", debounce(applyFilters, 300));

    renderCards(allSubmissions);
  } catch (error) {
    submissionList.innerHTML = `<div class="error-message"><p>Error loading submissions: ${error.message}</p></div>`;
  }
}
document.addEventListener("DOMContentLoaded", initialize);

// ======================================================
// Filter and Render
// ======================================================
function applyFilters() {
  const searchTerm = (searchInput?.value || "").toLowerCase().trim();
  const selectedAY = (academicYearFilter?.value || "").trim();
  const selectedSemester = (semesterFilter?.value || "").trim();

  let filtered = [...allSubmissions];
  if (selectedAY) filtered = filtered.filter(sub => sub.academicYear === selectedAY);
  if (selectedSemester) filtered = filtered.filter(sub => sub.semester === selectedSemester);
  if (searchTerm) {
    filtered = filtered.filter(sub => {
      const searchable = [
        sub.orgInfo?.name,
        sub.orgInfo?.acronym,
        sub.applicationInfo?.applicantName,
        sub.event?.eventName
      ].map(f => (f || "").toLowerCase());
      return searchable.some(f => f.includes(searchTerm));
    });
  }

  renderCards(filtered);
}

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ======================================================
// Render cards
// ======================================================
function renderCards(subs) {
  if (!subs.length) {
    submissionList.innerHTML = `
      <div class="no-data">
        <img src="../Images/student_img/no-data.png" alt="No Data" style="width:120px;margin-bottom:1rem;">
        <p>No submissions found</p>
      </div>`;
    return;
  }

  submissionList.innerHTML = "";
  subs.forEach(s => {
    const org = s.orgInfo || {};
    const event = s.event || {};
    const app = s.applicationInfo || {};
    const card = document.createElement("div");
    card.className = "submission-card";

    const eventDate = event.eventDate
      ? new Date(event.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "-";

    card.innerHTML = `
      <div class="submission-details">
        <div class="submission-header">
          <div class="org-info">
            <h3>${org.name || "Unnamed Org"}</h3>
            <span class="academic-info">${s.academicYear || "-"} | ${s.semester || "-"}</span>
          </div>
        </div>
        <div class="event-details">
          <h4>${event.eventName || "Untitled Event"}</h4>
          <div class="event-meta">
            <span class="icon-calendar">${eventDate}</span>
            <span class="icon-location">${event.eventVenue || "-"}</span>
            <span class="icon-user">${app.applicantName || "-"}</span>
          </div>
        </div>
        <div class="submission-footer">
          <button class="view-btn" data-id="${s._id}"><span class="icon-eye">View Details</span></button>
        </div>
      </div>
    `;
    submissionList.appendChild(card);
  });
}

// ======================================================
// Modal handling
// ======================================================
submissionList.addEventListener("click", e => {
  const viewBtn = e.target.closest(".view-btn");
  if (!viewBtn) return;
  const id = viewBtn.dataset.id;
  const sub = allSubmissions.find(s => s._id === id);
  if (sub) fillModal(sub);
});

function fillModal(sub) {
  const org = sub.orgInfo || {};
  const app = sub.applicationInfo || {};
  const event = sub.event || {};
  currentEditingId = sub._id;

  const eventDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";

  modal.innerHTML = `
    <div class="modal-content">
    <div class="modal-header">
      <h2>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
        ${org.name || "Unknown Organization"} 
        <span class="org-acronym">${org.acronym ? `(${org.acronym})` : ""}</span>
      </h2>

      <!-- close button INSIDE header so it stays with the sticky header -->
      <button class="modal-close" id="modalClose" aria-label="Close">
        <span class="icon-close" aria-hidden="true"></span>
      </button>

      <div class="modal-subheader">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        ${sub.academicYear || "-"} | ${sub.semester || "-"}
      </div>
    </div>

      <div class="modal-body">
        <form id="editEventForm">
          <div class="modal-section">
            <h3>
              <div class="section-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Event Details
                <span class="section-status">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Editable
                </span>
              </div>
            </h3>
            
            <div class="detail-group">
              <label class="detail-label">Event Name</label>
              <input type="text" class="detail-input" name="eventName" value="${event.eventName || ""}" required>
            </div>

            <div class="detail-group">
              <label class="detail-label">Description</label>
              <textarea class="detail-input detail-textarea" name="eventDescription" required>${event.eventDescription || ""}</textarea>
            </div>

            <div class="detail-group">
              <label class="detail-label">Date</label>
              <input type="date" class="detail-input" name="eventDate" value="${event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : ""}" required>
            </div>

            <div class="detail-group">
              <label class="detail-label">Venue</label>
              <input type="text" class="detail-input" name="eventVenue" value="${event.eventVenue || ""}" required>
            </div>

            <div class="detail-group">
              <label class="detail-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Supporting Documents
              </label>
              <div class="document-links">
                ${(event.supportingDocuments || []).map(doc => `
                  <a href="${doc}" class="doc-link" target="_blank">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                      <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                    <span class="doc-name">${doc.split('/').pop()}</span>
                    <svg class="doc-external" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                `).join("")}
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="modalCancel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Close
            </button>
            <button type="submit" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  modal.style.display = "flex";
  document.getElementById("modalClose").addEventListener("click", () => {
    modal.style.display = "none";
  });
}

window.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

// Handle form submission
modal.addEventListener("submit", async (e) => {
  if (e.target.id !== "editEventForm") return;
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  
  try {
    const updatedEvent = {
      eventName: formData.get("eventName"),
      eventDescription: formData.get("eventDescription"),
      eventDate: formData.get("eventDate"),
      eventVenue: formData.get("eventVenue")
    };

    // Update the submission in memory
    const submissionIndex = allSubmissions.findIndex(s => s._id === currentEditingId);
    if (submissionIndex >= 0) {
      allSubmissions[submissionIndex].event = {
        ...allSubmissions[submissionIndex].event,
        ...updatedEvent
      };
    }

    // TODO: Add API call to save changes to the backend
    // const response = await fetch("/api/submissions/" + currentEditingId, {
    //   method: "PATCH",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ event: updatedEvent })
    // });

    // Refresh the cards display
    renderCards(allSubmissions);
    
    // Close modal
    modal.style.display = "none";
    
    // Show success message
    alert("Changes saved successfully!");
  } catch (error) {
    alert("Error saving changes: " + error.message);
  }
});

// Handle cancel button
modal.addEventListener("click", (e) => {
  if (e.target.id === "modalCancel") {
    modal.style.display = "none";
  }
});

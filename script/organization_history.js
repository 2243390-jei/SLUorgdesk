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
            <span class="org-acronym">${org.acronym || ""}</span>
          </div>
          <span class="academic-info">${s.academicYear || "-"} | ${s.semester || "-"}</span>
        </div>
        <div class="event-details">
          <h4>${event.eventName || "Untitled Event"}</h4>
          <div class="event-meta">
            <span class="icon-calendar">${eventDate}</span>
            <span class="icon-location">${event.eventVenue || "-"}</span>
          </div>
          <div class="applicant-info">
            <span class="icon-user">${app.applicantName || "-"}</span>
          </div>
        </div>
      </div>
      <div class="submission-actions">
        <button class="view-btn" data-id="${s._id}"><span class="icon-eye">View Details</span></button>
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

  const eventDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "-";

  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" id="modalClose"><span class="icon-close"></span></button>

      <div class="modal-header">
        <h2>${org.name || "Unknown Organization"} (${org.acronym || ""})</h2>
        <span>${sub.academicYear || "-"} | ${sub.semester || "-"}</span>
      </div>

      <div class="modal-body">
        <div class="modal-section">
          <h3><span class="icon-calendar"></span>Event Details</h3>
          <p><strong>Name:</strong> ${event.eventName || "-"}</p>
          <p><strong>Description:</strong> ${event.eventDescription || "-"}</p>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Venue:</strong> ${event.eventVenue || "-"}</p>
          <p><strong>Documents:</strong></p>
          <ul>
            ${(event.supportingDocuments || []).map(doc => `
              <li><a href="${doc}" target="_blank">${doc}</a></li>
            `).join("")}
          </ul>
        </div>
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

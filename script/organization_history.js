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


function getLoggedInGoogleUser() {
  try {
    return JSON.parse(localStorage.getItem("googleUser"));
  } catch (e) {
    return null;
  }
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// Normalize orgId from different shapes a submission might use
function extractOrgIdFromSubmission(sub) {
  const raw = sub?.orgInfo?.orgId;
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    if (raw.$oid) return raw.$oid;
    const keys = Object.keys(raw);
    for (const k of keys) {
      if (typeof raw[k] === "string" && /^[a-f0-9]{24}$/i.test(raw[k])) return raw[k];
    }
  }
  return null;
}

// Resolve an array of orgId strings for the logged-in user (best-effort)
async function resolveUserOrgIds() {
  // 1) localStorage override (single id or comma-separated)
  const local = localStorage.getItem("currentOrgId");
  if (local) {
    return local.split(",").map(s => s.trim()).filter(Boolean);
  }

  const urlOrg = getQueryParam("orgId");
  if (urlOrg) return [urlOrg];

  const user = getLoggedInGoogleUser();
  if (!user || !user.email) return [];

  try {
    const resp = await fetch("../dataFetch/fetchDatabase.php");
    if (!resp.ok) return [];
    const orgs = await resp.json(); // orgs is array of { _id, name, acronym, email, ... }

    const email = (user.email || "").toLowerCase();

    // matches by exact org email
    const byEmail = orgs.filter(o => (o.email || "").toLowerCase() === email).map(o => o._id);
    if (byEmail.length) return byEmail;

    // matches where user's email contains acronym or acronym contains user local-part
    const byAcronym = orgs.filter(o => {
      const acr = (o.acronym || "").toLowerCase();
      if (!acr) return false;
      return email.includes(acr);
    }).map(o => o._id);
    if (byAcronym.length) return byAcronym;

    // fallback: try partial name match using local-part of email (e.g. john.r@ -> 'john' might match org)
    const localPart = email.split("@")[0];
    const byName = orgs.filter(o => (o.name || "").toLowerCase().includes(localPart)).map(o => o._id);
    if (byName.length) return byName;

    return []; // nothing found
  } catch (err) {
    console.warn("resolveUserOrgIds error:", err);
    return [];
  }
}

/* ---------- Updated initialize() — fetch submissions then filter by orgId(s) ---------- */
async function initialize() {
  try {
    // get org ids associated with current user (may be empty)
    const userOrgIds = await resolveUserOrgIds(); // array of strings, possibly []

    // fetch all submissions (same API you already use)
    const response = await fetchWithTimeout(API_URL);
    const data = await response.json();
    // if fetchSubmissions.php already returns only org-specific results (rare), userOrgIds won't matter.
    let submissions = Array.isArray(data) ? data : [];

    // If we resolved userOrgIds, filter locally
    if (userOrgIds && userOrgIds.length > 0) {
      const allowed = new Set(userOrgIds.map(id => id.toString()));
      submissions = submissions.filter(s => {
        const oid = extractOrgIdFromSubmission(s);
        return oid && allowed.has(oid.toString());
      });
    } else {
      submissions = []; // hide all when no org match 
      submissionList.innerHTML = `
        <div class="no-data">
          <img src="../Images/student_img/no-data.png" alt="No Data" style="width:120px;margin-bottom:1rem;">
          <p>No organization detected for the logged-in user. Please select an organization or set <code>localStorage.currentOrgId</code>.</p>
        </div>`;
    }

    allSubmissions = submissions;

    // populate filters only when we have submissions
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
        <img src="../Images/student_img/history/book.png" alt="Books Icon" width="24" height="24" class="icon">
        ${org.name || "Unknown Organization"} 
        <span class="org-acronym">${org.acronym ? `(${org.acronym})` : ""}</span>
      </h2>

      <!-- close button INSIDE header so it stays with the sticky header -->
      <button class="modal-close" id="modalClose" aria-label="Close">
        <span class="icon-close" aria-hidden="true"></span>
      </button>

      <div class="modal-subheader">
        <img src="../Images/student_img/history/calendar_blank.png" alt="Calendar Icon" width="16" height="16" class="icon">
        ${sub.academicYear || "-"} | ${sub.semester || "-"}
      </div>
    </div>

      <div class="modal-body">
        <form id="editEventForm">
          <div class="modal-section">
            <h3>
              <div class="section-header">
                <img src="../Images/student_img/history/clock.png" alt="Clock Icon" width="20" height="20" class="icon">
                Event Details
                <span class="section-status">
                <img src="../Images/student_img/history/notes.png" alt="Notes Icon" width="12" height="12" class="icon">
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
                    <img src="../Images/student_img/history/file.png" alt="File Icon" width="16" height="16" class="icon">
                Supporting Documents
              </label>
              <div class="document-links">
                ${(event.supportingDocuments || []).map(doc => `
                  <a href="${doc}" class="doc-link" target="_blank">
                    <img src="../Images/student_img/history/file_empty.png" alt="Document Icon" width="20" height="20" class="icon">
                    <span class="doc-name">${doc.split('/').pop()}</span>
                    <img src="../Images/student_img/history/upload.png" alt="Document Icon" width="16" height="16" class="icon">
                  </a>
                `).join("")}
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="modalCancel">
              <img src="../Images/student_img/history/close_modal.png" alt="Close Icon" width="16" height="16" class="icon">
              Close
            </button>
            <button type="submit" class="btn btn-primary">
              <img src="../Images/student_img/history/save.png" alt="Close Icon" width="16" height="16" class="icon">
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

/* ========================================================
   organization_history.js – EVENTS ONLY EDITABLE
   Works with /api/Submissions | No logo | Status top-right
   ======================================================== */

const API_URL = "http://localhost:3000/api/Submissions";
let allSubmissions = [];
let currentEditingId = null; // Track which submission is being edited

// DOM Elements
const submissionList = document.getElementById("submissionList");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");
const timeFilter = document.getElementById("timeFilter");
const modal = document.getElementById("submissionModal");
const modalClose = document.getElementById("modalClose");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalEditBtn = document.getElementById("modalEditBtn");

// Helper: Format date
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Status badge
const getStatusClass = (s) => {
  s = (s || "").toUpperCase();
  return s === "APPROVED" ? "status-accepted" :
         s === "PENDING" ? "status-pending" :
         s === "NEEDS REVISION" ? "status-revision" : "status-pending";
};

const getStatusLabel = (s) => {
  s = (s || "").toUpperCase();
  return s === "APPROVED" ? "Accepted" :
         s === "PENDING" ? "Pending" :
         s === "NEEDS REVISION" ? "Needs Revision" : s || "Pending";
};

// Render Cards (No logo)
function renderCards(subs) {
  submissionList.innerHTML = subs.length ? "" : `<p class="no-data">No submissions found.</p>`;
  subs.forEach(s => {
    const org = s.organizationInfo || {};
    const card = document.createElement("div");
    card.className = "submission-card";
    card.innerHTML = `
      <div class="submission-details">
        <div class="submission-header">
          <h3>${org.org_name || "Unnamed Org"}</h3>
          <span class="status-badge ${getStatusClass(s.status)}">${getStatusLabel(s.status)}</span>
        </div>
        <div class="submission-meta">
          <strong>AY:</strong> ${s.academicYear || "-"} – ${s.semester || "-"}<br>
          <strong>Events:</strong> ${(s.events || []).length}<br>
          <strong>Submitted:</strong> ${formatDate(s.submittedAt)}
        </div>
      </div>
      <div class="submission-actions">
        <button class="view-btn" data-id="${s._id}">View</button>
        ${s.status === "PENDING" ? `<button class="edit-btn" data-id="${s._id}">Edit Events</button>` : ""}
      </div>
    `;
    submissionList.appendChild(card);
  });
}

// Fill Modal – ONLY EVENTS ARE EDITABLE
function fillModal(sub, editable = false) {
  const org = sub.organizationInfo || {};
  const app = sub.applicantInfo || {};
  const adv = sub.adviserInfo || {};
  const docs = sub.documentUploads || {};

  currentEditingId = editable ? sub._id : null;

  // --- READ-ONLY FIELDS (always) ---
  const setReadOnly = (id, val) => {
    const el = document.getElementById(id);
    if (el) { el.value = val || ""; el.readOnly = true; }
  };

  setReadOnly("modalCompleteName", org.org_name);
  setReadOnly("modalAcronym", org.org_acronym);
  setReadOnly("modalOfficialEmail", org.org_email);
  setReadOnly("modalSocialLinks", (org.org_social || []).join(", "));
  setReadOnly("modalApplicantName", app.applicant_name);
  setReadOnly("modalApplicantEmail", app.applicant_email);
  setReadOnly("modalSchool", org.org_category);
  setReadOnly("modalOrganizationType", org.org_type);
  setReadOnly("modalApplicantPosition", app.applicant_position);
  setReadOnly("modalAdviserNames", (adv.adviser_name || []).join(", "));
  setReadOnly("modalAdviserEmail", (adv.adviser_email || []).join(", "));

  const [sy, ey] = (sub.academicYear || "-").split("-");
  setReadOnly("modalStartYear", sy?.trim());
  setReadOnly("modalEndYear", ey?.trim());
  setReadOnly("modalSemester", sub.semester);

  setReadOnly("modalStrategicPlan", docs.strategic_plan?.fileName);
  setReadOnly("modalAnnualReport", docs.annual_report?.fileName);
  setReadOnly("modalCBL", docs.cbl?.fileName);
  setReadOnly("modalCBLStatus", docs.cbl_status || "—");
  setReadOnly("modalOfficersList", docs.officers_list?.fileName);
  setReadOnly("modalInfographic", docs.infographic?.fileName);
  setReadOnly("modalFinancialStatement", docs.financial_statement?.fileName);
  setReadOnly("modalVideoLink", docs.video_link || "—");
  setReadOnly("modalNote", sub.additional_note || "—");
  setReadOnly("modalCreatedAt", formatDate(sub.submittedAt));

  // --- EDITABLE: EVENTS ONLY ---
  const eventList = document.getElementById("modalEventList");
  eventList.innerHTML = "";

  if (Array.isArray(sub.events) && sub.events.length) {
    sub.events.forEach((ev, idx) => {
      const div = document.createElement("div");
      div.className = "event-item";
      div.dataset.index = idx;

      div.innerHTML = `
        <div class="event-fields">
          <input type="text" class="event-name" value="${ev.eventName || ""}" ${editable ? "" : "readonly"}>
          <div class="event-row">
            <input type="text" class="event-type" value="${ev.eventType || ""}" ${editable ? "" : "readonly"} placeholder="Type">
            <input type="date" class="event-date" value="${ev.eventDate || ""}" ${editable ? "" : "readonly"}>
          </div>
          <div class="event-row">
            <input type="text" class="event-time" value="${ev.startTime || ""}" ${editable ? "" : "readonly"} placeholder="Start">
            <input type="text" class="event-time" value="${ev.endTime || ""}" ${editable ? "" : "readonly"} placeholder="End">
          </div>
          <input type="text" class="event-venue" value="${ev.eventVenue || ""}" ${editable ? "" : "readonly"} placeholder="Venue">
          <input type="number" class="event-attendees" value="${ev.eventAttendees || ""}" ${editable ? "" : "readonly"} placeholder="Attendees">
          <input type="url" class="event-proof" value="${ev.eventProof || ""}" ${editable ? "" : "readonly"} placeholder="Proof Link">
          <input type="text" class="event-sdg" value="${(ev.eventSDG || []).join(", ")}" ${editable ? "" : "readonly"} placeholder="SDGs (comma-separated)">
          ${editable ? `<button type="button" class="remove-event">Remove</button>` : ""}
        </div>
      `;
      eventList.appendChild(div);
    });
  } else {
    eventList.innerHTML = "<p>No events recorded.</p>";
  }

  // Add New Event Button (only in edit mode)
  if (editable) {
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.textContent = "+ Add Event";
    addBtn.className = "add-event-btn";
    addBtn.onclick = () => addNewEventField();
    eventList.appendChild(addBtn);
  }

  // Show Save Button only in edit mode
  modalEditBtn.style.display = editable ? "inline-block" : "none";
}

// Add new empty event
function addNewEventField() {
  const eventList = document.getElementById("modalEventList");
  const idx = eventList.querySelectorAll(".event-item").length;
  const div = document.createElement("div");
  div.className = "event-item";
  div.dataset.index = idx;
  div.innerHTML = `
    <div class="event-fields">
      <input type="text" class="event-name" placeholder="Event Name">
      <div class="event-row">
        <input type="text" class="event-type" placeholder="Type">
        <input type="date" class="event-date">
      </div>
      <div class="event-row">
        <input type="text" class="event-time" placeholder="Start Time">
        <input type="text" class="event-time" placeholder="End Time">
      </div>
      <input type="text" class="event-venue" placeholder="Venue">
      <input type="number" class="event-attendees" placeholder="Attendees">
      <input type="url" class="event-proof" placeholder="Proof Link">
      <input type="text" class="event-sdg" placeholder="SDGs (comma-separated)">
      <button type="button" class="remove-event">Remove</button>
    </div>
  `;
  eventList.insertBefore(div, eventList.querySelector(".add-event-btn"));
}

// Collect all events from modal
function collectEvents() {
  const items = document.querySelectorAll("#modalEventList .event-item");
  return Array.from(items).map(item => {
    const inputs = item.querySelectorAll("input");
    return {
      eventName: inputs[0].value.trim(),
      eventType: inputs[1].value.trim(),
      eventDate: inputs[2].value,
      startTime: inputs[3].value.trim(),
      endTime: inputs[4].value.trim(),
      eventVenue: inputs[5].value.trim(),
      eventAttendees: inputs[6].value ? parseInt(inputs[6].value) : null,
      eventProof: inputs[7].value.trim(),
      eventSDG: inputs[8].value.split(",").map(s => s.trim()).filter(s => s)
    };
  }).filter(e => e.eventName); // Remove empty
}

// Save Changes (POST to server)
modalEditBtn.addEventListener("click", async () => {
  if (!currentEditingId) return;

  const updatedEvents = collectEvents();
  if (updatedEvents.length === 0) {
    alert("Please add at least one event.");
    return;
  }

  try {
    const res = await fetch(`/api/Submission/${currentEditingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: updatedEvents })
    });

    if (!res.ok) throw new Error("Failed to save");

    alert("Events updated successfully!");
    modal.style.display = "none";
    location.reload(); // Refresh to show updated data
  } catch (err) {
    alert("Error saving events: " + err.message);
  }
});

// Remove event
document.getElementById("modalEventList").addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-event")) {
    e.target.closest(".event-item").remove();
  }
});

// Filtering
function applyFilters() {
  let f = [...allSubmissions];
  const status = document.querySelector(".filter-btn.active")?.dataset.status?.toUpperCase();
  if (status && status !== "ALL") f = f.filter(s => (s.status || "").toUpperCase() === status);
  const term = searchInput.value.trim().toLowerCase();
  if (term) f = f.filter(s => {
    const org = (s.organizationInfo?.org_name || "").toLowerCase();
    const evs = (s.events || []).map(e => (e.eventName || "").toLowerCase());
    return org.includes(term) || evs.some(e => e.includes(term));
  });
  const t = timeFilter.value;
  if (t !== "all") {
    const now = new Date();
    f = f.filter(s => {
      const d = new Date(s.submittedAt);
      return t === "week" ? d >= new Date(now - 7*24*60*60*1000) :
             t === "month" ? d >= new Date(now.getFullYear(), now.getMonth()-1, now.getDate()) :
             t === "year" ? d >= new Date(now.getFullYear()-1, now.getMonth(), now.getDate()) : true;
    });
  }
  renderCards(f);
}

// Event Listeners
filterBtns.forEach(b => b.addEventListener("click", () => { filterBtns.forEach(x => x.classList.remove("active")); b.classList.add("active"); applyFilters(); }));
searchInput.addEventListener("input", applyFilters);
timeFilter.addEventListener("change", applyFilters);

submissionList.addEventListener("click", e => {
  const id = e.target.dataset.id;
  if (!id) return;
  const sub = allSubmissions.find(s => s._id === id);
  if (!sub) return;
  if (e.target.classList.contains("view-btn")) {
    fillModal(sub, false);
    modal.style.display = "flex";
  } else if (e.target.classList.contains("edit-btn") && sub.status === "PENDING") {
    fillModal(sub, true);
    modal.style.display = "flex";
  }
});

[modalClose, modalCloseBtn].forEach(el => el.addEventListener("click", () => modal.style.display = "none"));
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

// Load Data
(async () => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("HTTP " + res.status);
    allSubmissions = await res.json();
    renderCards(allSubmissions);
  } catch (err) {
    submissionList.innerHTML = `<p class="error">Failed to load. Is server running?</p>`;
  }
})();
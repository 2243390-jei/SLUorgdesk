// ✅ Load event details from localStorage (if redirected from OSASsubmissions)
const storedEvent = localStorage.getItem("selectedEvent");
if (storedEvent) {
  const e = JSON.parse(storedEvent);

  document.getElementById("eventName").textContent = e.eventName || "N/A";
  document.getElementById("eventType").textContent = e.eventType || "N/A";
  document.getElementById("eventDate").textContent = e.eventDate || "N/A";
  document.getElementById("startTime").textContent = e.startTime || "N/A";
  document.getElementById("endTime").textContent = e.endTime || "N/A";
  document.getElementById("eventVenue").textContent = e.eventVenue || "N/A";
  document.getElementById("attendance").textContent = e.attendance || "N/A";
  document.getElementById("eventSDG").textContent = Array.isArray(e.eventSDG)
    ? e.eventSDG.join(", ")
    : e.eventSDG || "None";
  document.getElementById("eventProof").href = e.eventProof || "#";

  const docsList = document.getElementById("supportingDocumentsList");
  if (Array.isArray(e.supportingDocuments) && e.supportingDocuments.length > 0) {
    docsList.innerHTML = e.supportingDocuments
      .map(doc => `<li><a href="${doc}" target="_blank">${doc}</a></li>`)
      .join("");
  } else {
    docsList.innerHTML = "<li>No additional documents</li>";
  }

  // ✅ Save the event_id temporarily to query PHP
  if (e.id) localStorage.setItem("selectedEventId", e.id);

  localStorage.removeItem("selectedEvent");
}

// ✅ Fetch submission details from PHP backend
async function loadSubmissionDetails() {
  const params = new URLSearchParams(window.location.search);
  let eventId = params.get("event_id");

  // Fallback: use stored event_id if URL param missing
  if (!eventId) eventId = localStorage.getItem("selectedEventId");

  console.log("🔍 Event ID from URL or localStorage:", eventId);

  if (!eventId) {
    document.body.innerHTML = "<p>No submission selected.</p>";
    return;
  }

  try {
    const res = await fetch(`../dataFetch/fetchSubmissions.php?event_id=${eventId}`);
    const data = await res.json();

    console.log("📦 Received data from PHP:", data);

    if (!res.ok || !data) {
      document.body.innerHTML = `<p>${data?.error || "Error fetching submission."}</p>`;
      return;
    }

    const submission = Array.isArray(data) ? data[0] : data;
    if (!submission) {
      document.body.innerHTML = "<p>No matching submission found.</p>";
      return;
    }

    const org = submission.orgInfo || {};
    const app = submission.applicationInfo || {};
    const event = submission.event || {};

    // --- Organization Info ---
    document.getElementById("orgName").textContent = org.name || "-";
    document.getElementById("orgAcronym").textContent = org.acronym || "-";
    document.getElementById("orgEmail").textContent = org.email || "-";
    document.getElementById("academicYear").textContent = submission.academicYear || "-";
    document.getElementById("semester").textContent = submission.semester || "-";

    // --- Applicant Info ---
    // document.getElementById("applicantName").textContent = app.applicantName || "-";
    // document.getElementById("applicantEmail").textContent = app.email || "-";
    // document.getElementById("applicantPosition").textContent = app.position || "-";

    // --- Event Info ---
    document.getElementById("eventName").textContent = event.eventName || "-";
    document.getElementById("eventType").textContent = event.eventType || "-";
    document.getElementById("eventDate").textContent = event.eventDate || "-";
    document.getElementById("startTime").textContent = event.startTime || "-";
    document.getElementById("endTime").textContent = event.endTime || "-";
    document.getElementById("eventVenue").textContent = event.eventVenue || "-";
    document.getElementById("attendance").textContent = event.attendance || "-";
    document.getElementById("eventDescription").textContent = event.eventDescription || "-";

    document.getElementById("eventSDG").textContent = Array.isArray(event.eventSDG)
      ? event.eventSDG.join(", ")
      : event.eventSDG || "None";

    // --- Event Documents ---
    document.getElementById("eventProof").href = event.eventProof || "#";

    const docsList = document.getElementById("supportingDocumentsList");
    if (Array.isArray(event.supportingDocuments) && event.supportingDocuments.length > 0) {
      docsList.innerHTML = event.supportingDocuments
        .map(doc => `<li><a href="${doc}" target="_blank">${doc}</a></li>`)
        .join("");
    } else {
      docsList.innerHTML = "<li>No additional documents</li>";
    }

  } catch (error) {
    console.error("❌ Error loading submission:", error);
    document.body.innerHTML = "<p>Failed to load submission details.</p>";
  }
}

loadSubmissionDetails();

// ✅ Comment Revisions Modal Logic
document.addEventListener("DOMContentLoaded", () => {
  const commentBtn = document.getElementById("commentRevisionsBtn");
  const modal = document.getElementById("commentModal");
  const closeModal = document.getElementById("closeModal");
  const submitComment = document.getElementById("submitComment");
  const commentBox = document.getElementById("revisionComment");

  if (!commentBtn || !modal) return;

  commentBtn.addEventListener("click", () => (modal.style.display = "block"));
  closeModal.addEventListener("click", () => (modal.style.display = "none"));
  window.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });

  submitComment.addEventListener("click", async () => {
    const comment = commentBox.value.trim();
    if (!comment) return alert("⚠️ Please write a comment before submitting.");

    alert("Comment submitted:\n\n" + comment);
    commentBox.value = "";
    modal.style.display = "none";
  });
});

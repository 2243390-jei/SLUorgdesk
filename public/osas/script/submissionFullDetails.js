// Load event details from localStorage (if redirected from OSASsubmissions)
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
      .map(doc => `<li><a href="${doc}" target="_blank">${doc.split('/').pop() || 'View Document'}</a></li>`)
      .join("");
  } else {
    docsList.innerHTML = "<li>No additional documents</li>";
  }

  // Save the event_id temporarily to query PHP
  if (e.id) localStorage.setItem("selectedEventId", e.id);

  localStorage.removeItem("selectedEvent");
}

// Fetch submission details from PHP backend
async function loadSubmissionDetails() {
  const params = new URLSearchParams(window.location.search);
  let eventId = params.get("event_id");

  // Fallback: use stored event_id if URL param missing
  if (!eventId) eventId = localStorage.getItem("selectedEventId");

  console.log("🔍 Event ID from URL or localStorage:", eventId);

  if (!eventId) {
    document.body.innerHTML = "<p style='padding: 20px; text-align: center;'>No submission selected.</p>";
    return;
  }

  try {
    const res = await fetch(`../../php-server/routes/submissions.php?event_id=${eventId}`);
    const result = await res.json();

    console.log("📦 Received data from PHP:", result);

    if (!res.ok || (!result.success && !result.data)) {
      document.body.innerHTML = `<p style='padding: 20px; text-align: center;'>${result?.error || "Error fetching submission."}</p>`;
      return;
    }

    const data = result.success ? result.data : result;
    const submission = Array.isArray(data) ? data[0] : data;
    if (!submission) {
      document.body.innerHTML = "<p style='padding: 20px; text-align: center;'>No matching submission found.</p>";
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
    const eventProofLink = document.getElementById("eventProof");
    eventProofLink.href = event.eventProof || "#";
    if (!event.eventProof) {
      eventProofLink.textContent = "No proof available";
      eventProofLink.style.pointerEvents = "none";
      eventProofLink.style.color = "var(--muted)";
    }

    const docsList = document.getElementById("supportingDocumentsList");
    if (Array.isArray(event.supportingDocuments) && event.supportingDocuments.length > 0) {
      docsList.innerHTML = event.supportingDocuments
        .map(doc => `<li><a href="${doc}" target="_blank">${doc.split('/').pop() || 'View Document'}</a></li>`)
        .join("");
    } else {
      docsList.innerHTML = "<li>No additional documents</li>";
    }

    // Add responsive behavior after loading content
    enhanceMobileExperience();

  } catch (error) {
    console.error("Error loading submission:", error);
    document.body.innerHTML = "<p style='padding: 20px; text-align: center;'>Failed to load submission details.</p>";
  }
}

// Function to enhance mobile experience
function enhanceMobileExperience() {
  // Make external links open in new tab with proper attributes
  document.querySelectorAll('a[href^="http"]').forEach(link => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });

  // Add touch-friendly improvements for mobile
  if (window.innerWidth <= 768) {
    document.querySelectorAll('button').forEach(button => {
      button.style.minHeight = '44px'; // Minimum touch target size
    });

    // Improve modal for mobile
    const modal = document.getElementById('commentModal');
    if (modal) {
      modal.style.alignItems = 'flex-start';
      modal.style.paddingTop = '20px';
      modal.style.overflowY = 'auto';
    }
  }
}

// Handle responsive behavior on resize
window.addEventListener('resize', enhanceMobileExperience);

// Comment Revisions Modal Logic - ADDED THIS MISSING SECTION
document.addEventListener("DOMContentLoaded", () => {
  const commentBtn = document.getElementById("commentRevisionsBtn");
  const modal = document.getElementById("commentModal");
  const closeModal = document.getElementById("closeModal");
  const submitComment = document.getElementById("submitComment");
  const commentBox = document.getElementById("revisionComment");

  if (!commentBtn || !modal) {
    console.error("Modal elements not found");
    return;
  }

  console.log("Modal elements loaded successfully");

  // Function to open modal
  function openModal() {
    console.log("Opening modal");
    modal.style.display = "block";
    // Focus on textarea for better UX
    setTimeout(() => {
      commentBox.focus();
    }, 100);
  }

  // Function to close modal
  function closeModalFunc() {
    console.log("Closing modal");
    modal.style.display = "none";
    commentBox.value = ""; // Clear comment when closing
  }

  // Add event listeners to both buttons
  commentBtn.addEventListener("click", openModal);
  
  closeModal.addEventListener("click", closeModalFunc);
  
  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModalFunc();
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "block") {
      closeModalFunc();
    }
  });

  // Enhanced comment submission
  submitComment.addEventListener("click", async () => {
    const comment = commentBox.value.trim();
    if (!comment) {
      if (window.innerWidth <= 768) {
        showMobileAlert("⚠️ Please write a comment before submitting.");
      } else {
        alert("⚠️ Please write a comment before submitting.");
      }
      commentBox.focus();
      return;
    }

    // Here you would typically send the comment to your backend
    // For now, we'll just show a success message
    console.log("Comment submitted:", comment);
    
    if (window.innerWidth <= 768) {
      showMobileAlert("Comment submitted successfully!");
    } else {
      alert("Comment submitted successfully!\n\n" + comment);
    }
    
    // Clear and close modal
    commentBox.value = "";
    closeModalFunc();
  });

  // Handle Enter key in comment box (Ctrl+Enter to submit)
  commentBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitComment.click();
    }
  });
});

// Load submission details after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  loadSubmissionDetails();
});

// Mobile-friendly alert function
function showMobileAlert(message) {
  const alertDiv = document.createElement('div');
  alertDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    text-align: center;
    max-width: 80%;
    font-size: 16px;
  `;
  alertDiv.textContent = message;
  
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 9999;
  `;
  
  overlay.appendChild(alertDiv);
  document.body.appendChild(overlay);
  
  // Auto-close after 2 seconds
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  }, 2000);
  
  // Also allow tap to close
  overlay.addEventListener('click', () => {
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  });
}
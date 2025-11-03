// Load Submission Details
async function loadSubmissionDetails() {
  const params = new URLSearchParams(window.location.search);
  const submissionId = params.get("submissionId");

  if (!submissionId) {
    document.body.innerHTML = "<p>No submission selected.</p>";
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/Submission/${submissionId}`);
    const data = await res.json();

    if (!res.ok) {
      document.body.innerHTML = `<p>${data.message || "Error fetching submission."}</p>`;
      return;
    }

    // Use formDetails 
    const form = data.formDetails || {};

    document.getElementById("completeName").textContent = form.completeName || "-";
    document.getElementById("acronym").textContent = form.acronym || "-";
    document.getElementById("officialEmail").textContent = form.officialEmail || "-";
    document.getElementById("applicantName").textContent = form.applicantName || "-";
    document.getElementById("applicantEmail").textContent = form.applicantEmail || "-";
    document.getElementById("category").textContent = form.category || "-";
    document.getElementById("organizationType").textContent = form.organizationType || "-";
    document.getElementById("applicantPosition").textContent = form.applicantPosition || "-";
    document.getElementById("school").textContent = form.school || "-";
    document.getElementById("cblStatus").textContent = form.cblStatus || "-";
    document.getElementById("status").textContent = data.status || "-";
    document.getElementById("remarks").textContent = data.remarks || "—";
    document.getElementById("submittedBy").textContent = data.submittedBy || "-";
    document.getElementById("createdAt").textContent = new Date(data.createdAt).toLocaleString();
    document.getElementById("updatedAt").textContent = new Date(data.updatedAt).toLocaleString();

    // Lists
    const socialMediaList = document.getElementById("socialMediaLinks");
    if (Array.isArray(form.socialMediaLinks)) {
      socialMediaList.innerHTML = form.socialMediaLinks
        .map(link => `<li><a href="${link}" target="_blank">${link}</a></li>`)
        .join("");
    }

    const adviserEmailsList = document.getElementById("adviserEmails");
    if (Array.isArray(form.adviserEmails)) {
      adviserEmailsList.innerHTML = form.adviserEmails.map(email => `<li>${email}</li>`).join("");
    }

    const adviserNamesList = document.getElementById("adviserNames");
    if (Array.isArray(form.adviserNames)) {
      adviserNamesList.innerHTML = form.adviserNames.map(name => `<li>${name}</li>`).join("");
    }

    // File links
    document.getElementById("strategicPlans").href = form.strategicPlans?.url || "#";
    document.getElementById("annualReport").href = form.annualReport?.url || "#";
    document.getElementById("constitutionByLaws").href = form.constitutionByLaws?.url || "#";
    document.getElementById("infographics").href = form.infographics?.url || "#";
    document.getElementById("videoLink").href = form.videoLink || "#";
  } catch (error) {
    console.error("Error:", error);
    document.body.innerHTML = "<p>Failed to load submission details.</p>";
  }
}

loadSubmissionDetails();



// Comment Revisions Modal
document.addEventListener("DOMContentLoaded", () => {
  // Use your correct button ID from the HTML file
  const commentBtn = document.getElementById("commentRevisionsBtn");
  const modal = document.getElementById("commentModal");
  const closeModal = document.getElementById("closeModal");
  const submitComment = document.getElementById("submitComment");
  const commentBox = document.getElementById("revisionComment");

  // Stop errors if elements are missing
  if (!commentBtn || !modal) return;

  // Open modal 
  commentBtn.addEventListener("click", () => {
    modal.style.display = "block";
  });

  // Close modal 
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close modal when clicking outside the box
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Comment submission warning
  submitComment.addEventListener("click", async () => {
    const comment = commentBox.value.trim();
    if (!comment) {
      alert("⚠️ Please write a comment before submitting.");
      return;
    }

   
    alert("Comment submitted:\n\n" + comment);

    // Clear the box and close modal
    commentBox.value = "";
    modal.style.display = "none";
  });
});

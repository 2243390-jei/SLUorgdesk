document.addEventListener("DOMContentLoaded", async () => {
  // Get organization info from URL
  const urlParams = new URLSearchParams(window.location.search);
  const orgId = urlParams.get("orgId");
  const orgName = urlParams.get("orgName");

  const orgNameDisplay = document.getElementById("orgNameDisplay");
  if (orgNameDisplay && orgName) {
    orgNameDisplay.textContent = decodeURIComponent(orgName);
  }

  // If no orgId in the URL, stop here
  if (!orgId) {
    console.error("No orgId found in URL");
    document.getElementById("submissionsContainer").innerHTML = `
      <p style="color:red;">No organization selected. Please go back to the organization list.</p>
    `;
    return;
  }

  try {
    // Fetch submissions filtered by orgId
    const response = await fetch(`../dataFetch/fetchSubmissions.php?orgId=${orgId}`);
    const submissions = await response.json();

    renderSubmissions(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    document.getElementById("submissionsContainer").innerHTML = `
      <p style="color:red;">Failed to load submissions. Please try again later.</p>
    `;
  }
});

// Renders the submissions table dynamically
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
          <th>Proof</th>
          <th>Supporting Documents</th>
        </tr>
      </thead>
      <tbody>
  `;

  submissions.forEach(sub => {
    const e = sub.event || {};
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
        <td>
          ${
            e.eventProof
              ? `<a href="${e.eventProof}" target="_blank">View Proof</a>`
              : "N/A"
          }
        </td>
        <td>${docs || "None"}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

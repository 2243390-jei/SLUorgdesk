<?php
session_start();
if (empty($_SESSION['logged_in'])) {
    header('Location: ../../index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="styles/submissionFullDetails.css">
  <link rel="icon" type="image/png" href="../Images/Icon.png" sizes="32x32">
  <script src="script/submissionFullDetails.js" defer></script>
  <title>Full Details</title>
</head>

<body>
  <div class="app">=
    <main class="main-area" role="main">
      <div class="container">
        <h1>Event Submission Details</h1>
        <p>Below are the details of the selected organization's event submission.</p>

        <!-- Organization Info -->
        <section class="form-section">
          <h2>Organization Information</h2>
          <div class="details-grid">
            <div><label>Organization Name:</label><p id="orgName"></p></div>
            <div><label>Acronym:</label><p id="orgAcronym"></p></div>
            <div><label>Email:</label><p id="orgEmail"></p></div>
            <div><label>Academic Year:</label><p id="academicYear"></p></div>
            <div><label>Semester:</label><p id="semester"></p></div>
          </div>
        </section>

        <!-- Event Info -->
        <section class="form-section">
          <h2>Event Information</h2>
          <div class="details-grid">
            <div><label>Event Name:</label><p id="eventName"></p></div>
            <div><label>Event Type:</label><p id="eventType"></p></div>
            <div><label>Date:</label><p id="eventDate"></p></div>
            <div><label>Start Time:</label><p id="startTime"></p></div>
            <div><label>End Time:</label><p id="endTime"></p></div>
            <div><label>Venue:</label><p id="eventVenue"></p></div>
            <div><label>Attendance:</label><p id="attendance"></p></div>
            <div><label>SDG Goals:</label><p id="eventSDG"></p></div>
          </div>
          <div class="description">
            <label>Description:</label>
            <p id="eventDescription"></p>
          </div>
        </section>

        <!-- Documents -->
        <section class="form-section">
          <h2>Documents</h2>
          <div class="details-grid">
            <div><label>Event Proof:</label><a id="eventProof" target="_blank">View File</a></div>
          </div>
          <label>Supporting Documents:</label>
          <ul id="supportingDocumentsList"></ul>
        </section>

        <!-- Buttons -->
        <div class="btn-container">
          <button onclick="window.history.back()">← Back</button>
          <button id="commentRevisionsBtn">Comment Revisions</button>
        </div>

        <!-- Modal -->
        <div id="commentModal" class="modal">
          <div class="modal-content">
            <span class="close-btn" id="closeModal">&times;</span>
            <h2>Write your comment for revisions:</h2>
            <textarea id="revisionComment" placeholder="Type your comment here..."></textarea>
            <div class="modal-actions">
              <button id="submitComment">Submit Comment</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>

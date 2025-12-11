<?php
require_once __DIR__ . '/../../php-server/middleware/AuthMiddleware.php';
AuthMiddleware::requireRole('OSAS');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Organization Submissions</title>
  <link rel="stylesheet" href="styles/osasmain.css">
  <link rel="stylesheet" href="styles/OSASsubmissions.css">
  <link rel="icon" type="image/png" href="../images/Icon.png" sizes="32x32">
  <script src="script/OSASsubmissions.js" defer></script>
</head>
<body data-page="submissions">
  <div class="app">
    
    <!-- Mobile Header -->
    <div class="mobile-header">
      <button id="mobileMenuToggle" class="mobile-menu-toggle" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
      <div class="mobile-greeting">
        <h1 id="mobilePageTitle">Organization Submissions</h1>
      </div>
      <div class="mobile-logo">
        <img src="../images/student_img/SLU_orgdesk_logo.png" alt="SLU Logo">
      </div>
    </div>

    <!-- Sidebar -->
    <aside class="sidebar" aria-label="Main navigation">
      <div class="sidebar-top">
        <div class="sidebar-profile">
          <div class="avatar">O</div>
          <div class="profile-text">
            <div class="admin-title">OSAS</div>
            <div class="admin-sub" id="desktopPageTitle">Submissions</div>
          </div>
        </div>
      </div>

      <nav class="sidebar-menu" aria-label="Sidebar navigation">
        <ul>
          <li class="nav-item" data-page="calendar">
            <img src="../images/osas/calendar.png" alt="Calendar" class="menu-icon">
            <span class="menu-label">CALENDAR</span>
          </li>
          <li class="nav-item" data-page="orgs">
            <img src="../images/osas/group.png" alt="Organizations" class="menu-icon">
            <span class="menu-label">ORG MANAGEMENT</span>
          </li>
          <li class="nav-item" data-page="analytics">
            <img src="../images/osas/statistics.png" alt="Analytics" class="menu-icon">
            <span class="menu-label">ANALYTICS</span>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <button id="logoutBtn" class="btn-logout" title="Logout" aria-label="Logout">
          <img src="../images/osas/logout.png" alt="Logout" class="menu-icon">
          <span class="menu-label">LOGOUT</span>
        </button>
      </div>
    </aside>
    
    <main class="main-content">
      <header class="header">
        <div class="greeting">
          <div class="header-title-container">
            <button id="backButton" class="back-button" title="Back to Organizations" aria-label="Back to Organizations">
              <img src="../images/back.png" alt="back">
            </button>
            <div>
              <h1>Organization Submissions</h1>
              <div class="muted">Viewing submissions for selected organization</div>
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="org-name-display" id="orgNameDisplay"></div>

          <div class="search-container">
            <div class="search-box">
              <input type="text" id="searchInput" placeholder="Search event..." aria-label="Search event">
            </div>
          </div>

          <div class="filter-container">
            <button id="filterToggle" class="filter-btn" title="Filter" aria-label="Filter">
              <img src="../images/filter.png" alt="filter-btn">
            </button>

            <div id="filterDropdown" class="filter-dropdown hidden">
              <button class="filter-category">Category</button>
              <div class="filter-sub hidden" data-type="category">
                <button data-category="Workshop">Workshop</button>
                <button data-category="Program">Program</button>
                <button data-category="Seminar">Seminar</button>
                <button data-category="Conference">Conference</button>
                <button data-category="Hackathon">Hackathon</button>
                <button data-category="Training">Training</button>
                <button data-category="Forum">Forum</button>
              </div>

              <!-- Location -->
              <button class="filter-category">Location</button>
              <div class="filter-sub hidden" data-type="location">
                <button data-sub="Maryheights">Maryheights ▸</button>
                <div class="filter-sub2 hidden" data-parent="Maryheights">
                  <button>Maryheights AVR</button>
                  <button>Maryheights Lobby</button>
                  <button>B.Y.O.D Laboratory</button>
                  <button>Maryheights Oval</button>
                </div>

                <button data-sub="Main Campus">Main Campus ▸</button>
                <div class="filter-sub2 hidden" data-parent="Main Campus">
                  <button>Main Campus CCA</button>
                  <button>Main Campus Lobby</button>
                  <button>Diego Silang Building</button>
                  <button>Dr. Konrad Adenauer Science Building</button>
                  <button>Dr. Jose P. Rizal Building</button>
                  <button>Otto Hahn Engineering Building</button>
                  <button>Msgr. Charles Vath Library Building</button>
                </div>
              </div>

              <!-- SDG Category -->
              <button class="filter-category">SDG Category</button>
              <div class="filter-sub hidden" data-type="sdg">
                <button data-sdg="1. No Poverty">SDG 1 - No Poverty</button>
                <button data-sdg="2. Zero Hunger">SDG 2 - Zero Hunger</button>
                <button data-sdg="3. Good Health and Well-being">SDG 3 - Good Health and Well-being</button>
                <button data-sdg="4. Quality Education">SDG 4 - Quality Education</button>
                <button data-sdg="5. Gender Equality">SDG 5 - Gender Equality</button>
                <button data-sdg="6. Clean Water and Sanitation">SDG 6 - Clean Water and Sanitation</button>
                <button data-sdg="7. Affordable and Clean Energy">SDG 7 - Affordable and Clean Energy</button>
                <button data-sdg="8. Decent Work and Economic Growth">SDG 8 - Decent Work and Economic Growth</button>
                <button data-sdg="9. Industry, Innovation and Infrastructure">SDG 9 - Industry, Innovation and Infrastructure</button>
                <button data-sdg="10. Reduced Inequalities">SDG 10 - Reduced Inequalities</button>
                <button data-sdg="11. Sustainable Cities and Communities">SDG 11 - Sustainable Cities and Communities</button>
                <button data-sdg="12. Responsible Consumption and Production">SDG 12 - Responsible Consumption and Production</button>
                <button data-sdg="13. Climate Action">SDG 13 - Climate Action</button>
                <button data-sdg="14. Life Below Water">SDG 14 - Life Below Water</button>
                <button data-sdg="15. Life on Land">SDG 15 - Life on Land</button>
                <button data-sdg="16. Peace, Justice and Strong Institutions">SDG 16 - Peace, Justice and Strong Institutions</button>
                <button data-sdg="17. Partnerships for the Goals">SDG 17 - Partnerships for the Goals</button>
              </div>

              <div class="filter-clear">
                <button id="clearFilterBtn">Clear Filter</button>
              </div>
            </div>
          </div>
          
          <!-- SLU OrgDesk Logo -->
          <div id="header-logo">
            <img src="../images/student_img/SLU_orgdesk_logo.png" alt="SLU OrgDesk Logo">
          </div>
        </div>
      </header>

      <div id="submissionsContainer">
      </div>
    </main>

    <!-- Logout Modal -->
    <div id="logoutModal" class="modal" role="dialog" aria-labelledby="logoutModalTitle" aria-hidden="true">
      <div class="modal-content">
        <h2 id="logoutModalTitle">Confirm Logout</h2>
        <p>Are you sure you want to logout?</p>
        <div class="modal-actions">
          <button id="confirmLogoutBtn" class="btn-primary">Yes, Logout</button>
          <button id="cancelLogoutBtn" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Submission Details Modal -->
    <div id="submissionModal" class="modal" role="dialog" aria-labelledby="submissionModalTitle" aria-hidden="true">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2 id="submissionModalTitle">Submission Details</h2>
          <button id="closeSubmissionModal" class="modal-close" aria-label="Close submission details">&times;</button>
        </div>
        <div class="modal-body" id="submissionDetailsBody">
          <!-- Submission details will be populated here -->
        </div>
        <div class="modal-footer">
          <button id="closeSubmissionModalBtn" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
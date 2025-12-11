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
    <link rel="stylesheet" href="styles/osasmain.css">
    <link rel="stylesheet" href="styles/OSASorgs.css">
    <link rel="icon" type="image/png" href="../images/Icon.png" sizes="32x32">
    <script src="script/OSASorgs.js" defer></script>
    <title>Organizations in SLU</title>
</head>
<body data-page="orgs">

  <div class="app">

    <!-- Mobile Header -->
    <div class="mobile-header">
      <button id="mobileMenuToggle" class="mobile-menu-toggle" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
      <div class="mobile-greeting">
        <h1 id="mobilePageTitle">OSAS Organizations</h1>
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
            <div class="admin-sub" id="desktopPageTitle">Organizations Dashboard</div>
          </div>
        </div>
      </div>

      <nav class="sidebar-menu" aria-label="Sidebar navigation">
        <ul>
          <li class="nav-item" data-page="calendar">
            <img src="../images/osas/calendar.png" alt="Calendar" class="menu-icon">
            <span class="menu-label">CALENDAR</span>
          </li>
          <li class="nav-item active" data-page="orgs">
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
          <h1>Hello, OSAS</h1>
          <div class="muted">Here are all the student organizations inside of Saint Louis University</div>
        </div>

        <div class="top-actions">
          <div class="search-wrap">
            <button id="filterToggle" title="Filter" aria-label="Filter">
              <img src="../images/osas/filter.png" alt="Filter" class="filter-icon">
            </button>
            <input id="searchInput" type="search" placeholder="Search an Organization" aria-label="Search an Organization">
            <button id="searchClear" title="Clear" aria-label="Clear search">x</button>

            <div id="filterMenu" class="filter-menu hidden">
              <button class="filter-item" data-filter="SEA">SEA</button>
              <button class="filter-item" data-filter="SAMCIS">SAMCIS</button>
              <button class="filter-item" data-filter="SONAHBS">SONAHBS</button>
              <button class="filter-item" data-filter="STELA">STELA</button>
              <button class="filter-item" data-filter="SOM">SOM</button>
              <button class="filter-item" data-filter="SOL">SOL</button>
              <button class="filter-item" data-filter="UNIVERSITY-WIDE">UNIVERSITY-WIDE</button>
              <div class="filter-clear">
                <button id="clearFilterBtn">Clear Filter</button>
              </div>
            </div>
          </div>
          
          <div id="header-logo">
            <img src="../images/student_img/SLU_orgdesk_logo.png" alt="SLU OrgDesk Logo">
          </div>
        </div>
      </header>

      <table class="org-table">
        <thead>
          <tr>
            <th></th>
            <th>Organization</th>
            <th>School</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="orgTableBody"></tbody>
      </table>
    </main>

    <!-- Logout Modal -->
    <div id="logoutModal" class="modal" aria-hidden="true">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Confirm Logout</h3>
          <button id="logoutModalClose" class="modal-close" aria-label="Close">
            <img src="../images/osas/cross.png" alt="Close">
          </button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to log out?</p>
        </div>
        <div class="modal-footer">
          <button id="logoutCancel" class="btn-secondary">Cancel</button>
          <button id="logoutConfirm" class="btn-primary">Logout</button>
        </div>
      </div>
    </div>

    <!-- Submissions List Modal -->
    <div id="submissionsModal" class="modal" role="dialog" aria-labelledby="submissionsModalTitle" aria-hidden="true">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2 id="submissionsModalTitle">Organization Submissions</h2>
          <button id="closeSubmissionsModal" class="modal-close" aria-label="Close submissions list">&times;</button>
        </div>
        <div class="modal-body" id="submissionsListBody">
          <!-- Submissions list will be populated here -->
        </div>
        <div class="modal-footer">
          <button id="closeSubmissionsModalBtn" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- Submission Full Details Modal -->
    <div id="submissionDetailsModal" class="modal" role="dialog" aria-labelledby="submissionDetailsModalTitle" aria-hidden="true">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2 id="submissionDetailsModalTitle">Submission Details</h2>
          <button id="closeSubmissionDetailsModal" class="modal-close" aria-label="Close submission details">&times;</button>
        </div>
        <div class="modal-body" id="submissionDetailsBody">
          <!-- Submission details will be populated here -->
        </div>
        <div class="modal-footer">
          <button id="backToSubmissionsBtn" class="btn-secondary">Back to Submissions</button>
          <button id="closeSubmissionDetailsBtn" class="btn-secondary">Close All</button>
        </div>
      </div>
    </div>

  </div>
</body>
</html>
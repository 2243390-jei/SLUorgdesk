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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Osas Calendar — Analytics Dashboard</title>
  <link rel="stylesheet" href="styles/osasmain.css">
  <link rel="stylesheet" href="styles/analytics.css">
  <link rel="icon" type="image/png" href="../images/Icon.png" sizes="32x32">
</head>
<body data-page="analytics">

  <div class="app">

    <!-- Mobile Header -->
    <div class="mobile-header">
      <button id="mobileMenuToggle" class="mobile-menu-toggle" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
      <div class="mobile-greeting">
        <h1 id="mobilePageTitle">Analytics Dashboard</h1>
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
            <div class="admin-sub" id="desktopPageTitle">Analytics Dashboard</div>
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
          <li class="nav-item active" data-page="analytics">
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

    <!-- Main Content -->
    <main class="main-content">
      <header class="header">
        <div class="greeting">
          <h1>Hello, OSAS</h1>
          <div class="muted">Organization analytics and insights</div>
        </div>
        <div class="header-logo">
          <img src="../images/student_img/SLU_orgdesk_logo.png" alt="SLU OrgDesk Logo">
        </div>
      </header>

      <div class="dashboard-body">
        <!-- Top Row -->
        <div class="dashboard-row">
          <div class="orgs-section">
            <div class="section-header">
              <h2>Top Active Organizations</h2>
            </div>
            <div class="orgs-list" id="orgsList"></div>
          </div>

          <div class="charts-section">
            <div class="chart-card">
              <div class="chart-header">
                <h3>Monthly Submissions</h3>
              </div>
              <div class="chart-container">
                <canvas id="submissionsChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- SDG Submissions -->
        <div class="dashboard-row">
          <div class="chart-full">
            <div class="chart-card">
              <div class="chart-header">
                <h2>SDG Submissions</h2>
                <div class="sdg-stats">
                  <span class="sdg-count" id="sdgSubmissions">0 Events</span>
                  <span class="sdg-goals" id="sdgGoals">0 Goals</span>
                </div>
              </div>
              <div class="chart-container-large">
                <canvas id="sdgChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Submissions by School -->
        <div class="dashboard-row">
          <div class="chart-full">
            <div class="chart-card">
              <div class="chart-header">
                <h2>Submissions by School</h2>
              </div>
              <div class="chart-container-large">
                <canvas id="schoolsChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Logout Modal -->
      <div id="logoutModal" class="modal">
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

      <footer class="footer">© <span id="curYear"></span> Osas Dashboard</footer>
    </main>
  </div>

  <script src="script/analytics.js"></script>
</body>
</html>
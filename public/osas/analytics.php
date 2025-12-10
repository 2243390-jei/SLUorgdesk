<?php
session_start();
if (empty($_SESSION['logged_in'])) {
    header('Location: ../../index.php');
    exit;
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Osas Calendar — Analytics Dashboard</title>
  <link rel="stylesheet" href="styles/analytics.css">
  <link rel="icon" type="image/png" href="../Images/Icon.png" sizes="32x32">
</head>
<body>
  <div class="app">
    <!-- Left circular sidebar -->
    <aside class="leftbar sidebar-expanded" aria-label="Main navigation">
      <div class="sidebar-top">
        <div class="sidebar-profile">
          <div class="avatar">A</div>
          <div class="profile-text">
            <div class="admin-title">ADMIN</div>
            <div class="admin-sub muted">Admin Name</div>
          </div>
        </div>
      </div>

      <nav class="sidebar-menu" aria-label="Sidebar">
        <ul>
          <li class="nav-item" onclick="location.href='../osas/calendar.php'">
            <img src="../Images/osas/calendar.png" alt="" class="menu-icon">
            <span class="menu-label">CALENDAR</span>
          </li>
          <li class="nav-item" onclick="location.href='../osas/orgs.php'">
            <img src="../Images/osas/group.png" alt="" class="menu-icon">
            <span class="menu-label">ORG MANAGEMENT</span>
          </li>
          <li class="nav-item active" onclick="location.href='../osas/analytics.php'">
            <img src="../Images/osas/statistics.png" alt="" class="menu-icon">
            <span class="menu-label">ANALYTICS</span>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <button id="logoutBtn" class="btn-logout" title="Logout" aria-label="Logout">
          <span class="menu-label">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <main class="main-area">
      <header class="header">
        <div class="greeting">
          <h1>Hello, OSAS</h1>
          <div class="muted">Here are all the student organizations inside of Saint Louis University</div>
        </div>

        <div class="top-actions">
          <div class="search-wrap">
            <input id="searchInput" type="search" placeholder="Search an Organization" aria-label="Search an Organization">
            <button id="searchClear" title="Clear" aria-label="Clear search">x</button>
          </div>
          <!-- Profile moved to header -->
          <div class="profile-header">
            <div class="profile-circle" id="mobileProfileBtn">O</div>
          </div>
        </div>
      </header>

      <div class="body">
        <!-- Charts Row 1: Top Active Organizations + Monthly Submissions -->
        <div class="charts-row">
          <div class="orgs-section">
            <div class="section-header">
              <h2>Top Active Organizations</h2>
            </div>
            <div class="orgs-list" id="orgsList">
              <!-- Organizations will be populated by JavaScript -->
            </div>
          </div>

          <div class="charts-section">
            <div class="chart-card">
              <div class="chart-header">
                <h3>Monthly Submissions</h3>
              </div>
              <div class="chart-container">
                <canvas id="submissionsChart"></canvas>
                <div class="chart-hover-info" id="submissionsHover"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row 2: SDG Submissions -->
        <div class="charts-row">
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
                <div class="chart-hover-info" id="sdgHover"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row 3: Submissions by School -->
        <div class="charts-row">
          <div class="chart-full">
            <div class="chart-card">
              <div class="chart-header">
                <h2>Submissions by School</h2>
              </div>
              <div class="chart-container-large">
                <canvas id="schoolsChart"></canvas>
                <div class="chart-hover-info" id="schoolsHover"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Logout Confirmation Modal -->
      <div id="logoutModal" class="modal" aria-hidden="true" aria-labelledby="logoutModalTitle">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="logoutModalTitle">Confirm Logout</h3>
            <button id="logoutModalClose" class="modal-close" aria-label="Close">
              <img src="../Images/osas/cross.png" alt="Close" class="nav-icon">
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

      <!-- Mobile Profile Modal -->
      <div id="profileModal" class="modal profile-modal" aria-hidden="true" aria-labelledby="profileModalTitle">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="profileModalTitle">Profile</h3>
            <button id="profileModalClose" class="modal-close" aria-label="Close">
              <img src="../Images/osas/cross.png" alt="Close" class="nav-icon">
            </button>
          </div>
          <div class="modal-body">
            <div class="profile-info">
              <div class="profile-large">O</div>
              <div class="profile-details">
                <h4>OSAS Admin</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="footer muted">© <span id="curYear"></span> Osas Dashboard</footer>
    </main>
  </div>

  <script src="script/analytics.js"></script>
</body>
</html>
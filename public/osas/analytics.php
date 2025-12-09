<?php
session_start();
if (empty($_SESSION['logged_in'])) {
    header('Location: ../index.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styles/analytics.css">
    <link rel="icon" type="image/png" href="../images/Icon.png" sizes="32x32">
    <title>OSAS Analytics Dashboard</title>
</head>
<body>
  <div class="app">
    <aside class="leftbar" aria-label="Main navigation">
      <div class="brand">
        <img src="../images/SLU_logo.png" alt="SLU Logo" class="logo">
      </div>

      <nav class="left-nav" aria-label="Sidebar">
        <a href="../osas/calendar.php" class="nav-link circle-btn" title="Calendar" aria-label="Calendar">
          <img src="../images/osas/calendar.png" alt="Calendar" class="nav-icon">
        </a>
        <a href="../osas/orgs.php" class="nav-link circle-btn" title="Organizations" aria-label="Organizations">
          <img src="../images/osas/group.png" alt="Organizations" class="nav-icon">
        </a>
        <a href="../osas/analytics.php" class="nav-link circle-btn active" title="Analytics" aria-label="Analytics">
          <img src="../images/osas/statistics.png" alt="Analytics" class="nav-icon">
        </a>
        <!-- Logout button in sidebar -->
        <button id="logoutBtn" class="circle-btn logout-btn" title="Logout" aria-label="Logout">
          <img src="../images/osas/logout.png" alt="Logout" class="nav-icon">
        </button>
      </nav>
    </aside>  

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
          <div class="profile-header">
            <button class="profile-circle" id="mobileProfileBtn">O</button>
          </div>
        </div>
      </header>

      <div class="body">
        <!-- Stats Overview Cards - COMPLETELY REMOVED -->

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
      <div id="logoutModal" class="modal" role="dialog" aria-hidden="true" aria-labelledby="logoutModalTitle">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="logoutModalTitle">Confirm Logout</h3>
            <button id="logoutModalClose" class="modal-close" aria-label="Close">
              <img src="../images/osas/cross.png" alt="Close" class="nav-icon">
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
      <div id="profileModal" class="modal profile-modal" role="dialog" aria-hidden="true" aria-labelledby="profileModalTitle">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="profileModalTitle">Profile</h3>
            <button id="profileModalClose" class="modal-close" aria-label="Close">
              <img src="../images/osas/cross.png" alt="Close" class="nav-icon">
            </button>
          </div>
          <div class="modal-body">
            <!-- Content will be populated by JS -->
          </div>
        </div>
      </div>

      <footer class="footer muted">© <span id="curYear"></span> Osas Dashboard</footer>
    </main>
  </div>
  
  <script src="script/analytics.js"></script>
</body>
</html>

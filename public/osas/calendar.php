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
  <title>Osas Calendar — Past Events</title>
  <link rel="stylesheet" href="styles/calendar.css">
  <link rel="icon" type="image/png" href="../Images/Icon.png" sizes="32x32">
</head>
<body>
  <div class="app">
    <!-- Left circular sidebar -->
    <aside class="leftbar sidebar-expanded" aria-label="Main navigation">
      <div class="sidebar-top">
        <div class="sidebar-profile">
          <div class="avatar">O</div>
          <div class="profile-text">
            <div class="admin-title">OSAS</div>
            <div class="admin-sub muted"></div>
          </div>
        </div>
      </div>

      <nav class="sidebar-menu" aria-label="Sidebar">
        <ul>
          <li class="nav-item active" onclick="location.href='../osas/calendar.php'">
            <img src="../Images/osas/calendar.png" alt="" class="menu-icon">
            <span class="menu-label">CALENDAR</span>
          </li>
          <li class="nav-item" onclick="location.href='../osas/orgs.php'">
            <img src="../Images/osas/group.png" alt="" class="menu-icon">
            <span class="menu-label">ORG MANAGEMENT</span>
          </li>
          <li class="nav-item" onclick="location.href='../osas/analytics.php'">
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
          <div class="muted">Here's what happened this month</div>
        </div>

        <div id="header-logo" class="header-logo">
          <img src="../Images/student_img/SLU_orgdesk_logo.png" alt="SLU OrgDesk Logo" class="logo-img">
        </div>
      </header>

      <div class="body">
        <!-- Calendar column -->
        <section class="calendar-column" aria-label="Calendar">
          <div class="calendar-head">
            <div class="month-block">
              <div class="month-year-linear">
                <span id="monthName" class="month-name">October</span>
                <span id="yearName" class="year-name">2025</span>
              </div>
            </div>

            <!-- Navigation controls -->
            <div class="nav-controls">
              <button id="prevBtn" class="icon-btn" aria-label="Previous month">
                <img src="../Images/osas/back.png" alt="Previous" class="nav-icon">
              </button>
              <button id="todayBtn" class="btn-small">
                <img src="../Images/osas/calendar.png" alt="Today" class="nav-icon">
                Today
              </button>
              <button id="nextBtn" class="icon-btn" aria-label="Next month">
                <img src="../Images/osas/next.png" alt="Next" class="nav-icon">
              </button>
            </div>
          </div>

          <div id="calendarGrid" class="calendar-grid" aria-hidden="false">
            <!-- Week headers -->
            <div class="week">Sun</div>
            <div class="week">Mon</div>
            <div class="week">Tue</div>
            <div class="week">Wed</div>
            <div class="week">Thu</div>
            <div class="week">Fri</div>
            <div class="week">Sat</div>
            <!-- days injected by script.js -->
          </div>
        </section>

        <!-- Right panel: Past Events -->
        <aside class="right-panel" aria-label="Past events">
          <div class="panel-top">
            <h2>Past Events</h2>
          </div>

          <!-- Search moved to top of panel -->
          <div class="search-wrap panel-search">
            <input 
              id="searchInput" 
              type="search" 
              placeholder="Search past events..." 
              aria-label="Search past events">
            <button id="searchClear" class="search-clear-btn" title="Clear" aria-label="Clear search">×</button>
          </div>

          <!-- Fixed-size, scrollable events list -->
          <div id="eventsList" class="events-list" aria-live="polite" tabindex="0">
            <!-- Event cards injected by script.js -->
          </div>

          <div class="panel-footer muted small">Click an event to view details; click a day to focus its events.</div>
        </aside>
      </div>

      <!-- Slide-in detail panel + overlay -->
      <div id="overlay" class="overlay" tabindex="-1" aria-hidden="true"></div>
      <aside id="detailPanel" class="detail-panel" aria-hidden="true" aria-labelledby="detailTitle">
        <div class="detail-header">
          <div>
            <h3 id="detailTitle">Event Details</h3>
            <div id="detailMeta" class="muted small"></div>
          </div>
          <button id="detailClose" class="detail-close" aria-label="Close details">
            <img src="../Images/osas/cross.png" alt="Close" class="nav-icon">
          </button>
        </div>

        <div id="detailBody" class="detail-body" tabindex="0"></div>
      </aside>

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

      <footer class="footer muted">© <span id="curYear"></span> Osas Dashboard</footer>
    </main>
  </div>

  <script src="script/calendar.js"></script>
</body>
</html>

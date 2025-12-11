<?php
require_once __DIR__ . '/../../php-server/middleware/AuthMiddleware.php';
AuthMiddleware::requireRole('OSAS');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Osas Calendar — Past Events</title>
  <link rel="stylesheet" href="styles/osasmain.css">
  <link rel="stylesheet" href="styles/calendar.css">
  <link rel="icon" type="image/png" href="../images/Icon.png" sizes="32x32">
  <script src="script/profile.js" defer></script>
</head>
<body data-page="calendar">

  <div class="app">

    <!-- Mobile Header -->
    <div class="mobile-header">
      <button id="mobileMenuToggle" class="mobile-menu-toggle" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
      <div class="mobile-greeting">
        <h1 id="mobilePageTitle">OSAS Calendar</h1>
      </div>
      <div class="mobile-logo">
        <img src="../images/student_img/SLU_orgdesk_logo.png" alt="SLU Logo">
      </div>
    </div>

    <!-- Sidebar -->
     <aside class="sidebar" aria-label="Main navigation">
      <div class="sidebar-top">
        <div class="sidebar-profile">
          <img id="profile-icon" src="../images/user.png" alt="Profile Icon" width="32" height="32">
          <div class="profile-text">
            <div class="admin-name">OSAS</div>
            <div class="admin-email">Loading...</div>
          </div>
        </div>
      </div>

      <nav class="sidebar-menu" aria-label="Sidebar navigation">
        <ul>
          <li class="nav-item active" data-page="calendar">
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

    <!-- Main Content -->
    <main class="main-content">
      <header class="header">
        <div class="greeting">
          <h1>Hello, OSAS</h1>
          <div class="muted">Here's what happened this month</div>
        </div>
        <div class="header-logo">
          <img src="../images/student_img/SLU_orgdesk_logo.png" alt="SLU OrgDesk Logo">
        </div>
      </header>

      <div class="content-body">
        <section class="calendar-section" aria-label="Calendar">
          <div class="calendar-header">
            <div class="month-display">
              <div class="month-year-center">
                <span id="monthName" class="month-name">October</span>
                <span id="yearName" class="year-name">2025</span>
              </div>
            </div>
            <div class="calendar-controls">
              <button id="prevBtn" class="icon-btn" aria-label="Previous month">
                <img src="../images/osas/back.png" alt="Previous">
              </button>
              <button id="todayBtn" class="btn-small">
                <img src="../images/osas/calendar.png" alt="Today"> Today
              </button>
              <button id="nextBtn" class="icon-btn" aria-label="Next month">
                <img src="../images/osas/next.png" alt="Next">
              </button>
            </div>
          </div>
          <div id="calendarGrid" class="calendar-grid">
            <div class="week">Sun</div><div class="week">Mon</div><div class="week">Tue</div>
            <div class="week">Wed</div><div class="week">Thu</div><div class="week">Fri</div><div class="week">Sat</div>
          </div>
        </section>

        <aside class="events-panel" aria-label="Past events">
          <div class="panel-header">
            <h2>Past Events</h2>
          </div>
          <div class="panel-search">
            <input id="searchInput" type="search" placeholder="Search past events..." aria-label="Search past events">
            <button id="searchClear" class="search-clear" aria-label="Clear search">×</button>
          </div>
          <div id="eventsList" class="events-list"></div>
          <div class="panel-footer muted">Click an event to view details</div>
        </aside>
      </div>

      <div id="overlay" class="overlay"></div>
      <aside id="detailPanel" class="detail-panel">
        <div class="detail-header">
          <button id="detailBack" class="detail-back" aria-label="Go back">
            <img src="../images/osas/back.png" alt="Back"><span class="back-text">Back</span>
          </button>
          <div class="detail-header-content">
            <h3 id="detailTitle">Event Details</h3>
            <div id="detailMeta" class="muted"></div>
          </div>
          <button id="detailClose" class="detail-close" aria-label="Close">
            <img src="../images/osas/cross.png" alt="Close">
          </button>
        </div>
        <div id="detailBody" class="detail-body"></div>
      </aside>

      <!-- Logout Modal -->
      <div id="logoutModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Confirm Logout</h3>
            <button id="logoutModalClose" class="modal-close" aria-label="Close">
              <img src="../images/osas/cross.png" alt="Close">
            </button>
          </div>
          <div class="modal-body"><p>Are you sure you want to log out?</p></div>
          <div class="modal-footer">
            <button id="logoutCancel" class="btn-secondary">Cancel</button>
            <button id="logoutConfirm" class="btn-primary">Logout</button>
          </div>
        </div>
      </div>

      <footer class="footer">© <span id="curYear"></span> Osas Dashboard</footer>
    </main>
  </div>

  <script src="script/calendar.js"></script>
</body>
</html>
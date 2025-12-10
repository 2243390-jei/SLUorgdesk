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
    <link rel="stylesheet" href="styles/OSASorgs.css">
    <link rel="icon" type="image/png" href="../Images/Icon.png" sizes="32x32">
    <script src="script/osasorgs.js" defer></script>
    <title>Organizations in SLU</title>
</head>
<body>
  <div class="app">
    <!-- Left circular sidebar - copied from analytics.php -->
    <aside class="leftbar sidebar-expanded" aria-label="Main navigation">
      <div class="sidebar-top">
        <div class="sidebar-profile">
          <div class="avatar">O</div>
          <div class="profile-text">
            <div class="admin-title">OSAS</div>
            <!-- <div class="admin-sub muted">Admin Name</div> -->
          </div>
        </div>
      </div>

      <nav class="sidebar-menu" aria-label="Sidebar">
        <ul>
          <li class="nav-item" onclick="location.href='../osas/calendar.php'">
            <img src="../Images/osas/calendar.png" alt="" class="menu-icon">
            <span class="menu-label">CALENDAR</span>
          </li>
          <li class="nav-item active" onclick="location.href='../osas/orgs.php'">
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
    
    <main class="main-area">
      <header class="header">
        <div class="greeting">
          <h1>Hello, OSAS</h1>
          <div class="muted">Here are all the student organizations inside of Saint Louis University</div>
        </div>

        <div class="top-actions">
          <div class="search-wrap">
            <button id="filterToggle" title="Filter" aria-label="Filter">
              <img src="../Images/osas/filter.png" alt="Filter" class="filter-icon">
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
         
          <div class="profile-header">
            <button class="profile-circle" id="mobileProfileBtn">O</button>
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

    <div id="logoutModal" class="modal" aria-hidden="true" aria-labelledby="logoutModalTitle">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="logoutModalTitle">Confirm Logout</h3>
          <button id="logoutModalClose" class="modal-close" aria-label="Close">
            <img src="../Images/cross.png" alt="Close" class="nav-icon">
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

    <div id="profileModal" class="modal profile-modal" aria-hidden="true" aria-labelledby="profileModalTitle">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="profileModalTitle">Profile</h3>
          <button id="profileModalClose" class="modal-close" aria-label="Close">
            <img src="../Images/cross.png" alt="Close" class="nav-icon">
          </button>
        </div>
        <div class="modal-body">
        </div>
      </div>
    </div>
  </div>
</body>
</html>
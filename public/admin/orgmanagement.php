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
  <title>Admin Organization Management</title>
  <link rel="stylesheet" href="styles/adminmain.css">
  <link rel="stylesheet" href="styles/orgmanagement.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <script src="./script/orgmanagement.js" defer></script>
</head>

<body>

  <!--LEFT SIDEBAR -->
  <aside id="sidebar">
    <div id="sidebar-profile">
      <div id="profile-icon"></div>
      <div id="profile-details">
        <div>ADMIN</div>
        <div>Admin Name</div>
      </div>
    </div>

    <nav id="sidebar-nav">
      <ul>
        <li><a href="dashboard.php">Dashboard</a></li>
        <li class="active"><a href="orgmanagement.php">Org Management</a></li>
        <li><a href="usermanagement.php">User Management</a></li>
        <li><a href="activitylogs.php">Activity Logs</a></li>        
      </ul>
    </nav>
  </aside>

  <!-- MAIN CONTENT WRAPPER-->
  <main id="main-content">

    <!-- ======= HEADER ======= -->
    <header id="main-header">
      <div id="header-text">
        <h1>ADMIN ORGANIZATION MANAGEMENT</h1>
        <p>Good day, Admin!</p>
        <p>Let's make sure everything's in order today.</p>
      </div>

      <div id="header-logo">
        <img src="../images/student_img/SLU_orgdesk_logo.png" alt="SLU OrgDesk Logo">
      </div>
    </header>

    <!--  ORGMANAGEMENT BODY -->
    <section id="gen-wrapper">
      <h2>Organization Management</h2>

      <div class="top-actions">
        <button id="addOrgBtn" class="add-org-header-btn">+ Add Organization</button>

        <div class="search-wrap">
          <input type="search" id="searchInput" placeholder="Search">
          <button id="searchClear" title="Clear search"></button>

          <button id="filterToggle" title="Filter">
            <img src="../Images/osas/filter.png" alt="filter-icon" class="">
          </button>

          <div id="filterMenu" class="filter-menu hidden">
            <button class="filter-item" data-filter="SEA">SEA</button>
            <button class="filter-item" data-filter="SAMCIS">SAMCIS</button>
            <button class="filter-item" data-filter="SONAHBS">SONAHBS</button>
            <button class="filter-item" data-filter="STELA">STELA</button>
            <button class="filter-item" data-filter="SOM">SOM</button>
            <button class="filter-item" data-filter="SOL">SOL</button>
            <button class="filter-item" data-filter="UNIVERSITY-WIDE">UNIVERSITY-WIDE</button>
            <div class="filter-clear"><button id="clearFilterBtn">Clear Filter</button></div>
          </div>
        </div>
      </div>

      <div class="bottom-actions">
        <div class="card-list" id="orgCardList"></div>
        <table class="org-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Organization</th>
              <th>Email</th>
              <th>Role</th>
              <th>School</th>
              <th> </th>
            </tr>
          </thead>
          <tbody id="orgTableBody"></tbody>
        </table>

        <div class="pagination-controls">
          <div class="rows-per-page">
            <label>
              Rows per page:
              <select id="rowsPerPage">
                <option value="5">5</option>
                <option value="10" selected>10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </label>
          </div>
          <div id="pagination">
            <button class="pagination-btn prev" aria-label="Previous page">«</button>
            <div class="page-numbers" role="list"></div>
            <button class="pagination-btn next" aria-label="Next page">»</button>
          </div>
        </div>
      </div>

    </section>

  </main>

  <div id="confirmModal" class="modal">
    <div class="modal-content">
      <h3>Are you sure you want to delete this organization?</h3>
      <div class="modal-buttons">
        <button id="confirmYes" class="danger-btn">Yes</button>
        <button id="confirmCancel" class="cancel-btn">Cancel</button>
      </div>
    </div>
  </div>

  <div id="editConfirmModal" class="createorg-modal">
    <div class="createorg-modal-content small-confirm">
      <h3>Are you sure you want to edit this organization?</h3>
      <div class="createorg-modal-actions">
        <button id="confirmEditYes" class="btn-outlined">Yes</button>
        <button id="confirmEditCancel" class="reset-btn">Cancel</button>
      </div>
    </div>
  </div>

  <div id="addOrgModal" class="createorg-modal">
    <div class="createorg-modal-content">
      <h2 id="orgFormTitle">Add Organization</h2>

      <form id="createOrgForm">
        <div class="createorg-modal-row">
          <label>Organization Name</label>
          <input type="text" id="orgName" placeholder="Enter organization name" required>
        </div>

        <div class="createorg-modal-row">
          <label>Acronym</label>
          <input type="text" id="orgAcronym" placeholder="Enter acronym" required>
        </div>

        <div class="createorg-modal-row">
          <label>Official Email</label>
          <input type="email" id="orgEmail" placeholder="Enter official email" required>
        </div>

        <div class="createorg-modal-row">
          <label>School</label>
          <input type="text" id="orgSchool" placeholder="Enter school" required>
        </div>

        <div class="createorg-modal-row">
          <label>Logo URL</label>
          <input type="text" id="orgLogo" placeholder="Enter the URL Image Logo">
        </div>

        <div class="createorg-modal-actions">
          <button type="submit" class="btn-outlined">Save</button>
          <button type="button" id="cancelCreateOrg" class="reset-btn">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</body>

</html>
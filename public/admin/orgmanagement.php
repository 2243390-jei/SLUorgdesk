<?php
session_start();
if (empty($_SESSION['logged_in'])) {
    header('Location: ../index.html');
    exit;
}
?>
<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Organization Management</title>

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <link rel="stylesheet" href="../style/orgmanagement.css">
  <script src="../script/orgmanagement.js" defer></script>
</head>

<body>
  <div class="app">
    <aside class="leftbar">
      <div class="brand">
        <img src="../Images/Icon.png" alt="SLU Logo" class="logo">
      </div>

      <nav class="left-nav">
        <a href="../admin/dashboard.html" class="circle-btn">
          <img src="../Images/statisctics.png" alt="" height="16" width="16">
        </a>
        <a href="../admin/orgmanagement.html" class="circle-btn active">
          <img src="../Images/osas/group.png" alt="" height="16" width="16">
        </a>
        <a href="../admin/usermanagement.php" class="circle-btn">
          <img src="../Images/osas/user.png" alt="" height="16" width="16">
        </a>
      </nav>
    </aside>

    <main class="main-area">
      <header class="header">
        <div class="greeting">
          <h1>Hello, Admin</h1>
          <div class="muted">
            Here are all the student organizations inside of Saint Louis University
          </div>
        </div>

        <div class="top-actions">
          <button id="addOrgBtn" class="add-org-header-btn">+ Add Organization</button>

          <div class="search-wrap">
            <button id="filterToggle" title="Filter">
              <img src="../Images/osas/filter.png" alt="filter-icon" class="" height="16" width="16">
            </button>

            <input type="search" id="searchInput" placeholder="Search">
            <button id="searchClear" title="Clear search"></button>

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

        </div>
      </header>

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

      <footer class="footer muted">
        © <span id="curYear"></span> Admin User Management
      </footer>
    </main>
  </div>

  <div id="confirmModal" class="modal">
    <div class="modal-content">
      <div class="modal-buttons">
        <button id="confirmYes" class="confirm-btn">Yes</button>
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

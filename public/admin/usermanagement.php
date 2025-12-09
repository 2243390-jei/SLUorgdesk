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
  <title>Admin User Management</title>

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <link rel="stylesheet" href="../style/usermanagement.css">
  <script src="../script/usermanagement.js" defer></script>
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
        <a href="../admin/orgmanagement.html" class="circle-btn">
          <img src="../Images/osas/group.png" alt="" height="16" width="16">
        </a>
        <a href="../admin/usermanagement.php" class="circle-btn active">
          <img src="../Images/osas/user.png" alt="" height="16" width="16">
        </a>
      </nav>
    </aside>

    <main class="main-area">
      <header class="header">
        <div class="greeting">
          <h1>User Management</h1>
          <div class="muted">
            Manage system users and roles
          </div>
        </div>

        <div class="top-actions">
          <button id="addUserBtn" class="add-user-header-btn">+ Add User</button>

          <div class="search-wrap">
            <input type="search" id="userSearchInput" placeholder="Search users">
            <button id="userSearchClear" title="Clear search"></button>
          </div>

        </div>
      </header>

      <table class="user-table">
        <thead>
          <tr>
            <th>Avatar</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Organization</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="userTableBody"></tbody>
      </table>

      <footer class="footer muted">
        © <span id="curYear"></span> User Management
      </footer>
    </main>
  </div>

  <div id="userModal" class="modal">
    <div class="modal-content">
      <form id="userForm">
        <label>Name</label>
        <input id="userName" required>
        <label>Email</label>
        <input id="userEmail" type="email" required>
        <label>Role</label>
        <select id="userRole">
          <option>Admin</option>
          <option>OSAS</option>
          <option>Org Officer</option>
          <option>Student</option>
        </select>

        <div class="modal-actions">
          <button type="submit" class="btn-outlined">Save</button>
          <button type="button" id="cancelUser" class="reset-btn">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</body>

</html>

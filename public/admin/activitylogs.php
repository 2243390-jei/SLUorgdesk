<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Admin Activity Logs</title>
    <link rel="stylesheet" href="styles/adminmain.css">
    <link rel="stylesheet" href="styles/activitylogs.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <script src="script/config.js" defer></script>
    <script src="script/adminmain.js" defer></script>
    <script src="script/activitylogs.js" defer></script>
    <link rel="icon" type="image/png" href="../images/Icon.png" sizes="32x32">        
</head>

<body>

    <!--LEFT SIDEBAR -->
    <aside id="sidebar">
        <div id="sidebar-profile">
            <img id="profile-icon" src="../images/user.png" alt="Profile Icon" width="32" height="32">
            <div id="profile-details">
                <div>ADMIN</div>
            </div>
        </div>

        <nav id="sidebar-nav">
            <ul>
                <li><a href="dashboard.php">Dashboard</a></li>
                <li><a href="orgmanagement.php">Org Management</a></li>
                <li><a href="usermanagement.php">User Management</a></li>
                <li class="active"><a href="activitylogs.php">Activity Logs</a></li>
            </ul>
        </nav>

        <div id="sidebar-footer">
            <button id="logoutBtn" class="btn-logout">Logout</button>
        </div>
    </aside>

    <!-- MAIN CONTENT WRAPPER-->
    <main id="main-content">

        <!-- ======= HEADER ======= -->
        <header id="main-header">
            <div id="header-text">
                <h1>ADMIN DASHBOARD</h1>
                <p>Good day, Admin!</p>
                <p>Let's make sure everything's in order today.</p>
            </div>

                <div id="header-logo">
                    <img src="../images/student_img/SLU_orgdesk_logo.png" alt="SLU OrgDesk Logo">
                </div>
        </header>

        <!--  ACTIVITYLOGS BODY -->
        <section id="gen-wrapper">
            <h2>Activity Logs</h2>
            <div class="data-section" style="margin-top: 18px;">
              <h3>Recent Activity</h3>
              <div id="recentActivityList" class="recent-activity"></div>
            </div>
        </section>

    </main>

    <!-- Logout Confirmation Modal -->
    <div id="logoutModal">
        <div class="modal-content">
            <h2>Confirm Logout</h2>
            <p>Are you sure you want to logout?</p>
            <div class="modal-buttons">
                <button type="button" class="danger-btn" id="confirmLogoutBtn">Logout</button>
                <button type="button" class="cancel-btn" id="cancelLogoutBtn">Cancel</button>
            </div>
        </div>
    </div>

</body>

</html>
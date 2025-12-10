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
    <title>Admin Activity Log</title>
    <link rel="stylesheet" href="styles/adminmain.css">
    <link rel="stylesheet" href="styles/activitylogs.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="./script/activitylogs.js" defer></script>
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
                <li><a href="orgmanagement.php">Org Management</a></li>
                <li><a href="usermanagement.php">User Management</a></li>
                <li class="active"><a href="activitylogs.php">Activity Logs</a></li>
            </ul>
        </nav>
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

        <!--  ACTLOGS BODY -->
        <section id="gen-wrapper">
            <h2>Activity Logs</h2>

        </section>

    </main>

</body>

</html>
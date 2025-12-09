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
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="styles/dashboard.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="script/dashboard.js"></script>
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
                <li class="active">Dashboard</li>
                <li>Org Management</li>
                <li>User Management</li>
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

        <!--  DASHBOARD BODY -->
        <section id="dashboard-wrapper">
            <h2>Analytics</h2>

            <!-- TOP WIDGETS WRAPPER -->
            <div id="top-widgets">
                <!-- Widget 1: Users by Role -->
                <div class="widget-box">
                    <h3>Users by Role</h3>
                    <canvas id="chartRoles"></canvas> 
                </div>

                <!-- Widget 2: Active Users -->
                <div class="widget-box">
                    <h3>Active Users</h3>
                    <canvas id="chartActive"></canvas> 
                </div>
            </div>

            <!-- LARGE BOTTOM WIDGET -->
            <div id="bottom-widget">
                <div class="large-box">
                    <h3>Users by School</h3>
                    <canvas id="chartSchools"></canvas> 
                </div>
            </div>
        </section>

    </main>

</body>

</html>
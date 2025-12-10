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
    <title>SLU OrgDesk | History</title>
    <link rel="stylesheet" href="styles/style.css" />
    <link rel="stylesheet" href="styles/history.css" />
    <link rel="icon" type="image/png" href="../images/Icon.png" sizes="32x32">
    <script src="script/mobile-drawer.js" defer></script>
</head>

<body class="home-body">
    <!-- NAVIGATION BAR -->
    <header class="navbar">
        <div class="logo">
            <img src="../images/student_img/SLU_orgdesk_logo.png" alt="SLU OrgDesk Logo" />
        </div>
        <nav>
            <ul>
                <li><a href="submission.php">Submission</a></li>
                <li><a href="history.php" class="active">History</a></li>
            </ul>
        </nav>
        <!-- PROFILE ICON + MODAL -->
        <div id="profileContainer" class="profile-icon">
            <img id="nav-profile-pic" src="../images/student_img/profile.png" alt="Profile" />

            <!-- Profile Modal -->
            <div class="profile-modal" id="profileModal" style="display: none;">
                <div class="profile-modal-content">
                    <button class="logout-btn" id="logoutBtn">Logout</button>
                    <button class="cancel-btn" id="cancelBtn">Cancel</button>
                </div>
            </div>
        </div>
    </header>

    <section class="history-section">
        <!-- Search and Filters -->
        <div class="history-controls">
            <input type="text" id="searchInput" placeholder="Search by Organization or Event..." />

            <div class="filter-container" id="filterContainer">
                <select id="academicYearFilter" class="filter-select">
                    <option value="">All Academic Years</option>
                </select>
                <select id="semesterFilter" class="filter-select">
                    <option value="">All Semesters</option>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Short Term">Short Term</option>
                </select>
            </div>
        </div>

        <!-- SUBMISSION CARDS -->
        <div id="submissionList" class="submission-cards"></div>

        <!-- MODAL: View Submission -->
        <div id="submissionModal" class="modal" aria-hidden="true"></div>
    </section>

    <script src="script/organization_history.js"></script>
    <script src="script/main.js"></script>
</body>

</html>
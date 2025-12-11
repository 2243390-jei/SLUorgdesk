<?php
session_start();

// Allow only OSAS to access this directory
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'OSAS') {
    // Redirect unauthorized users
    header('Location: ../index.php');
    exit();
}

// Continue with the requested page

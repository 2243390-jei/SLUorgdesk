<?php
session_start();

// Example: Only allow admin role to access
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    // Redirect unauthorized users
    header('Location: /login.php');
    exit();
}

// Continue with the requested page

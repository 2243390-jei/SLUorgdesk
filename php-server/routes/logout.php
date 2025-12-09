<?php
session_start();
header('Content-Type: application/json');

// Clear session data
$_SESSION = array();

// Destroy the PHP session
session_destroy();

// Ensure session variables are cleared
if (function_exists('session_unset')) {
    session_unset();
}

// Delete session cookie
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}

// Return success response
echo json_encode([
    'success' => true,
    'message' => 'Session terminated'
]);
?>

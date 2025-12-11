<?php
session_start();
header('Content-Type: application/json');

// Clear all session data
$_SESSION = array();

// Destroy the PHP session completely
session_destroy();

// Ensure all session variables are cleared
if (function_exists('session_unset')) {
    session_unset();
}

// Delete session cookie from client
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    // Clear the session cookie by setting past expiration
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

// Return logout success response
echo json_encode([
    'success' => true,
    'message' => 'Session terminated'
]);
?>

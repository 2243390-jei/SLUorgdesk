<?php
// Start session for user authentication
session_start();
// Load authentication controller
require_once __DIR__ . '/../controllers/AuthController.php';

// Enable CORS for cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
// Set response format to JSON
header('Content-Type: application/json');

// No cache headers
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Handle preflight CORS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Initialize authentication controller
$auth = new AuthController();
// Initialize response array
$response = [];

try {
    // Handle login requests
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get credentials from POST or JSON body
        $data = !empty($_POST) 
            ? ['email' => $_POST['email'] ?? '', 'password' => $_POST['password'] ?? '']
            : (json_decode(file_get_contents('php://input'), true) ?? []);

        // Validate login credentials
        $result = $auth->validateLogin($data);

        // If login successful, set session and redirect
        if ($result['success']) {
            $_SESSION['user'] = $result['data'];
            $_SESSION['logged_in'] = true;

            // Map role to redirect page
            $role = strtolower($result['data']['role'] ?? '');
            $redirectMap = [
                'osas' => 'osas/calendar.php',
                'admin' => 'admin/dashboard.html',
                'organization' => 'organization/submission.php'
            ];
            $result['redirect'] = $redirectMap[$role] ?? 'organization/submission.php';
        }

        $response = $result;
    // Handle get current user request
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['me'])) {
        // Return current session user or error
        $response = !empty($_SESSION['user']) 
            ? ['success' => true, 'data' => $_SESSION['user']]
            : ['success' => false, 'error' => 'Not logged in'];
    } else {
        // Return error for unsupported methods
        http_response_code(405);
        $response = ['success' => false, 'error' => 'Method not allowed'];
    }
} catch (Exception $e) {
    // Handle any exceptions and return error
    http_response_code(500);
    $response = ['success' => false, 'error' => $e->getMessage()];
}

// Return JSON response
echo json_encode($response);
?>
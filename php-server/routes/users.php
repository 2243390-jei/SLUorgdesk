<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Load controllers and middleware
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Set JSON response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Initialize controller and response
$controller = new UserController();
$response = [];

try {
    // Handle GET requests
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get current session user
        if (isset($_GET['session']) && $_GET['session'] === 'me') {
            $response = !empty($_SESSION['user']) 
                ? ['success' => true, 'data' => $_SESSION['user']]
                : ['success' => false, 'error' => 'No user logged in'];
        } else {
            // Require authentication for other GET requests
            AuthMiddleware::requireLogin();
            
            // Get user by ID
            if (isset($_GET['id'])) {
                $response = $controller->getById($_GET['id']);
            } elseif (isset($_GET['role'])) {
                // Get users by role (OSAS only)
                AuthMiddleware::requireRole('OSAS');
                $response = $controller->getByRole($_GET['role']);
            } elseif (isset($_GET['email'])) {
                // Get user by email (OSAS only)
                AuthMiddleware::requireRole('OSAS');
                $response = $controller->getByEmail($_GET['email']);
            }
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get request body
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        // Handle login action
        if (isset($data['action']) && $data['action'] === 'login') {
            // Authenticate user with email and password
            $email = isset($data['email']) ? trim(strtolower($data['email'])) : '';
            $password = isset($data['password']) ? $data['password'] : '';
            $response = $controller->authenticate($email, $password);
            
            // Set session if login successful
            if (is_array($response) && ($response['success'] ?? false) === true) {
                $_SESSION['user'] = $response['data'];
                $_SESSION['logged_in'] = true;
            }
        } else {
            // Only login action is supported
            $response = ['success' => false, 'error' => 'Invalid action'];
        }
    }
} catch (Exception $e) {
    // Handle any exceptions
    http_response_code(500);
    $response = ['success' => false, 'error' => $e->getMessage()];
}

// Return JSON response
echo json_encode($response);
?>

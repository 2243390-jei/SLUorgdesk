<?php
// Start session for this route
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$controller = new UserController();
$method = $_SERVER['REQUEST_METHOD'];
$response = [];

try {
    if ($method === 'GET') {
        if (isset($_GET['session']) && $_GET['session'] === 'me') {
            // Get current session user - allowed without explicit login check as session IS the check
            $response = !empty($_SESSION['user']) 
                ? ['success' => true, 'data' => $_SESSION['user']]
                : ['success' => false, 'error' => 'No user logged in'];
        } else {
            // Other GET operations require authentication
            $user = AuthMiddleware::requireLogin();
            
            if (isset($_GET['id'])) {
                $response = $controller->getById($_GET['id']);
            } elseif (isset($_GET['role'])) {
                // Only admin can filter by role
                AuthMiddleware::requireRole('Admin');
                $response = $controller->getByRole($_GET['role']);
            } elseif (isset($_GET['email'])) {
                // Only admin can search by email
                AuthMiddleware::requireRole('Admin');
                $response = $controller->getByEmail($_GET['email']);
            } else {
                // Only admin can get all users
                AuthMiddleware::requireRole('Admin');
                $response = $controller->getAll();
            }
        }
    } elseif ($method === 'POST') {
        // Check if this is a login request
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (isset($data['action']) && $data['action'] === 'login') {
            // Login does NOT require authentication
            $email = isset($data['email']) ? trim(strtolower($data['email'])) : '';
            $password = isset($data['password']) ? $data['password'] : '';
            $response = $controller->authenticate($email, $password);
            // on successful login, set session user
            if (is_array($response) && isset($response['success']) && $response['success'] === true) {
                $_SESSION['user'] = $response['data'];
                $_SESSION['logged_in'] = true;
            }
        } else {
            // User creation requires admin role
            AuthMiddleware::requireRole('admin');
            $response = $controller->create($data);
        }
    } elseif ($method === 'PUT') {
        // Authentication required for updates
        $user = AuthMiddleware::requireLogin();
        
        if (!isset($_GET['id'])) {
            $response = ['success' => false, 'error' => 'ID required'];
        } else {
            // Users can only update their own profile, admins can update anyone
            if ($user['role'] !== 'Admin' && $_GET['id'] !== (string)$user['_id']) {
                $response = ['success' => false, 'error' => 'Unauthorized: Cannot update another user'];
            } else {
                $data = json_decode(file_get_contents('php://input'), true);
                $response = $controller->update($_GET['id'], $data);
            }
        }
    } elseif ($method === 'DELETE') {
        // Only admin can delete users
        AuthMiddleware::requireRole('Admin');
        if (!isset($_GET['id'])) {
            $response = ['success' => false, 'error' => 'ID required'];
        } else {
            $response = $controller->delete($_GET['id']);
        }
    }
} catch (Exception $e) {
    $response = ['success' => false, 'error' => $e->getMessage()];
}

echo json_encode($response);
?>

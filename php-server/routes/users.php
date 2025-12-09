<?php
// Start session for this route
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../controllers/UserController.php';

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
            $response = !empty($_SESSION['user']) 
                ? ['success' => true, 'data' => $_SESSION['user']]
                : ['success' => false, 'error' => 'No user logged in'];
        } elseif (isset($_GET['id'])) {
            $response = $controller->getById($_GET['id']);
        } elseif (isset($_GET['role'])) {
            $response = $controller->getByRole($_GET['role']);
        } elseif (isset($_GET['email'])) {
            $response = $controller->getByEmail($_GET['email']);
        } else {
            $response = $controller->getAll();
        }
    } elseif ($method === 'POST') {
        // Check if this is a login request
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (isset($data['action']) && $data['action'] === 'login') {
            $email = isset($data['email']) ? trim(strtolower($data['email'])) : '';
            $password = isset($data['password']) ? $data['password'] : '';
            $response = $controller->authenticate($email, $password);
            // on successful login, set session user
            if (is_array($response) && isset($response['success']) && $response['success'] === true) {
                $_SESSION['user'] = $response['data'];
                $_SESSION['logged_in'] = true;
            }
        } else {
            // Regular user creation
            $response = $controller->create($data);
        }
    } elseif ($method === 'PUT') {
        if (!isset($_GET['id'])) {
            $response = ['success' => false, 'error' => 'ID required'];
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
            $response = $controller->update($_GET['id'], $data);
        }
    } elseif ($method === 'DELETE') {
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

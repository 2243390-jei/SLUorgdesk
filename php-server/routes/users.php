<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

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
$response = [];

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (isset($_GET['session']) && $_GET['session'] === 'me') {
            $response = !empty($_SESSION['user']) 
                ? ['success' => true, 'data' => $_SESSION['user']]
                : ['success' => false, 'error' => 'No user logged in'];
        } else {
            AuthMiddleware::requireLogin();
            
            if (isset($_GET['id'])) {
                $response = $controller->getById($_GET['id']);
            } elseif (isset($_GET['role'])) {
                AuthMiddleware::requireRole('OSAS');
                $response = $controller->getByRole($_GET['role']);
            } elseif (isset($_GET['email'])) {
                AuthMiddleware::requireRole('OSAS');
                $response = $controller->getByEmail($_GET['email']);
            }
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        if (isset($data['action']) && $data['action'] === 'login') {
            $email = isset($data['email']) ? trim(strtolower($data['email'])) : '';
            $password = isset($data['password']) ? $data['password'] : '';
            $response = $controller->authenticate($email, $password);
            
            if (is_array($response) && ($response['success'] ?? false) === true) {
                $_SESSION['user'] = $response['data'];
                $_SESSION['logged_in'] = true;
            }
        } else {
            AuthMiddleware::requireRole('OSAS');
            $response = $controller->create($data);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $user = AuthMiddleware::requireLogin();
        
        if (!isset($_GET['id'])) {
            $response = ['success' => false, 'error' => 'ID required'];
        } elseif ($user['role'] !== 'OSAS' && $_GET['id'] !== (string)$user['_id']) {
            $response = ['success' => false, 'error' => 'Unauthorized: Cannot update another user'];
        } else {
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $response = $controller->update($_GET['id'], $data);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = ['success' => false, 'error' => $e->getMessage()];
}

echo json_encode($response);
?>

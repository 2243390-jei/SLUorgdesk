<?php
session_start();
require_once __DIR__ . '/../controllers/AuthController.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$auth = new AuthController();
$response = [];

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = !empty($_POST) 
            ? ['email' => $_POST['email'] ?? '', 'password' => $_POST['password'] ?? '']
            : (json_decode(file_get_contents('php://input'), true) ?? []);

        $result = $auth->validateLogin($data);

        if ($result['success']) {
            $_SESSION['user'] = $result['data'];
            $_SESSION['logged_in'] = true;

            $role = strtolower($result['data']['role'] ?? '');
            $redirectMap = [
                'osas' => 'osas/calendar.php',
                'admin' => 'admin/dashboard.php',
                'organization' => 'organization/submission.php'
            ];
            $result['redirect'] = $redirectMap[$role] ?? 'organization/submission.php';
        }

        $response = $result;
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['me'])) {
        $response = !empty($_SESSION['user']) 
            ? ['success' => true, 'data' => $_SESSION['user']]
            : ['success' => false, 'error' => 'Not logged in'];
    } else {
        http_response_code(405);
        $response = ['success' => false, 'error' => 'Method not allowed'];
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = ['success' => false, 'error' => $e->getMessage()];
}

echo json_encode($response);
?>
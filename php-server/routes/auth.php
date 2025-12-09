<?php
session_start();
require_once __DIR__ . '/../controllers/AuthController.php';


header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$auth = new AuthController();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Accept both form POST and JSON POST
        if (!empty($_POST)) {
            $data = [
                'email' => $_POST['email'] ?? '',
                'password' => $_POST['password'] ?? ''
            ];
        } else {
            $data = json_decode(file_get_contents('php://input'), true) ?: [];
        }

        $result = $auth->loginFromData($data);

        if ($result['success']) {
            // set session
            $_SESSION['user'] = $result['data'];
            $_SESSION['logged_in'] = true;

            // Return JSON for client (AJAX or intercepted form submit)
            $role = strtolower($result['data']['role'] ?? '');
            $redirect = 'organization/submission.php';
            switch ($role) {
                case 'osas': $redirect = 'osas/calendar.php'; break;
                case 'admin': $redirect = 'admin/dashboard.php'; break;
                case 'organization': $redirect = 'organization/submission.php'; break;
            }

            $result['redirect'] = $redirect;
            $auth->jsonResponse($result);
        }

        // Failed login — always return JSON (do not redirect)
        $auth->jsonResponse($result);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // optional: return session user info
        if (isset($_GET['me']) && !empty($_SESSION['user'])) {
            $auth->jsonResponse(['success' => true, 'data' => $_SESSION['user']]);
        }
        $auth->jsonResponse(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    $auth->jsonResponse(['success' => false, 'error' => $e->getMessage()]);
}
?>
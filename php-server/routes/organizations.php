<?php
// Start session for this route
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../controllers/OrganizationController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Require authentication for all routes
$user = AuthMiddleware::requireLogin();

$controller = new OrganizationController();
$method = $_SERVER['REQUEST_METHOD'];
$response = [];

try {
    if ($method === 'GET') {
        // If any filter/query params are present, route to getFiltered so backend does the filtering
        $hasFilterParams = isset($_GET['search']) || isset($_GET['school']) || isset($_GET['acronym']) || isset($_GET['id']) || isset($_GET['limit']) || isset($_GET['offset']);
        if ($hasFilterParams) {
            $response = $controller->getFiltered($_GET);
        } else {
            $response = $controller->getAll();
        }
    }
} catch (Exception $e) {
    $response = ['success' => false, 'error' => $e->getMessage()];
}

echo json_encode($response);
?>

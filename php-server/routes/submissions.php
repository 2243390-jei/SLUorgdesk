<?php
// Start session for this route
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../controllers/SubmissionController.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$controller = new SubmissionController();
$method = $_SERVER['REQUEST_METHOD'];
$response = [];

try {
    if ($method === 'GET') {
        // If filtering parameters are provided, use controller->getFiltered
        $hasFilterParams = isset($_GET['search']) || isset($_GET['status']) || isset($_GET['month']) || isset($_GET['year']) || isset($_GET['organizationId']) || isset($_GET['myorg']) || isset($_GET['date']);
        if ($hasFilterParams) {
            // Pass through query string params to controller filter method
            $response = $controller->getFiltered($_GET);
        } elseif (isset($_GET['myorg']) && $_GET['myorg'] === '1') {
            if (empty($_SESSION['user']) || empty($_SESSION['user']['organizationId'])) {
                $response = ['success' => false, 'error' => 'User must be logged in with an organization'];
            } else {
                $response = $controller->getByOrganization($_SESSION['user']['organizationId']);
            }
        } elseif (isset($_GET['id'])) {
            $response = $controller->getById($_GET['id']);
        } elseif (isset($_GET['organizationId'])) {
            $response = $controller->getByOrganization($_GET['organizationId']);
        } elseif (isset($_GET['academicYear']) && isset($_GET['semester'])) {
            $response = $controller->getByYearSemester($_GET['academicYear'], $_GET['semester']);
        } else {
            $response = $controller->getAll();
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $response = $controller->create($data);
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

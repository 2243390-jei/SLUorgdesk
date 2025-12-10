<?php

// Start session for this route
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../controllers/SubmissionController.php';
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

$controller = new SubmissionController();
$method = $_SERVER['REQUEST_METHOD'];
$response = [];

try {
    if ($method === 'GET') {
        // If filtering parameters are provided, use controller->getFiltered
        $hasFilterParams = isset($_GET['search']) || isset($_GET['status']) || isset($_GET['month']) || isset($_GET['year']) || isset($_GET['organizationId']) || isset($_GET['myorg']) || isset($_GET['date']);
        if ($hasFilterParams) {
            // Non-admin users can only see submissions from their own organization
            if ($user['role'] !== 'Admin' && $user['role'] !== 'OSAS') {
                $_GET['organizationId'] = $user['organizationId'];
            }
            $response = $controller->getFiltered($_GET);
        } elseif (isset($_GET['myorg']) && $_GET['myorg'] === '1') {
            $response = $controller->getByOrganization($user['organizationId']);
        } elseif (isset($_GET['id'])) {
            $response = $controller->getById($_GET['id']);
        } elseif (isset($_GET['organizationId'])) {
            // Non-admin users can only see their own org submissions
            if ($user['role'] !== 'Admin' && $user['role'] !== 'OSAS' && $_GET['organizationId'] !== $user['organizationId']) {
                $response = ['success' => false, 'error' => 'Unauthorized: Cannot view submissions from another organization'];
            } else {
                $response = $controller->getByOrganization($_GET['organizationId']);
            }
        } elseif (isset($_GET['academicYear']) && isset($_GET['semester'])) {
            $response = $controller->getByYearSemester($_GET['academicYear'], $_GET['semester']);
        } else {
            // Non-admin users only see their org's submissions
            if ($user['role'] !== 'Admin' && $user['role'] !== 'OSAS') {
                $response = $controller->getByOrganization($user['organizationId']);
            } else {
                $response = $controller->getAll();
            }
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        // User must be submitting for their own organization
        if ($user['role'] !== 'admin' && $user['role'] !== 'osas' && isset($data['orgId'])) {
            if ($data['orgId'] !== $user['organizationId']) {
                $response = ['success' => false, 'error' => 'Unauthorized: Cannot submit for another organization'];
            } else {
                $response = $controller->create($data);
            }
        } else {
            $response = $controller->create($data);
        }
    } elseif ($method === 'PUT') {
        // Users can update their own organization's submissions, admin/OSAS can update any
        if (!isset($_GET['id'])) {
            $response = ['success' => false, 'error' => 'ID required'];
        } else {
            // If not admin/OSAS, verify the submission belongs to their organization
            if ($user['role'] !== 'Admin' && $user['role'] !== 'OSAS') {
                $submissionData = $controller->getById($_GET['id']);
                // Check both organizationId and orgInfo.orgId fields for organization matching
                $submissionOrgId = null;
                if (isset($submissionData['data']['organizationId'])) {
                    $submissionOrgId = $submissionData['data']['organizationId'];
                } elseif (isset($submissionData['data']['orgInfo']['orgId'])) {
                    $submissionOrgId = $submissionData['data']['orgInfo']['orgId'];
                }
                
                if (!$submissionData['success'] || $submissionOrgId !== $user['organizationId']) {
                    $response = ['success' => false, 'error' => 'Unauthorized: Cannot update submissions from another organization'];
                } else {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $response = $controller->update($_GET['id'], $data);
                }
            } else {
                $data = json_decode(file_get_contents('php://input'), true);
                $response = $controller->update($_GET['id'], $data);
            }
        }
    }
} catch (Exception $e) {
    $response = ['success' => false, 'error' => $e->getMessage()];
}
echo json_encode($response);
?>

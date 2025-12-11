<?php
if (session_status() === PHP_SESSION_NONE) session_start();

require_once __DIR__ . '/../controllers/SubmissionController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Set JSON response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// No cache headers
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Require authentication for all submission operations
$user = AuthMiddleware::requireLogin();

// Initialize controller and get request method
$controller = new SubmissionController();
$method = $_SERVER['REQUEST_METHOD'];
$response = [];

try {
    // Handle GET requests
    if ($method === 'GET') {
        // Check if filtering parameters are provided
        $hasFilterParams = isset($_GET['search']) || isset($_GET['status']) || isset($_GET['month']) || isset($_GET['year']) || isset($_GET['organizationId']) || isset($_GET['myorg']) || isset($_GET['date']);
        
        // Route to filtered search if filters present
        if ($hasFilterParams) {
            // Non-admin users can only see submissions from their own organization
            if ($user['role'] !== 'Admin' && $user['role'] !== 'OSAS') {
                $_GET['organizationId'] = $user['organizationId'];
            }
            $response = $controller->getFiltered($_GET);
        } elseif (isset($_GET['myorg']) && $_GET['myorg'] === '1') {
            // Get submissions for user's organization
            $response = $controller->getByOrganization($user['organizationId']);
        } elseif (isset($_GET['id'])) {
            // Get single submission by ID
            $response = $controller->getById($_GET['id']);
        } elseif (isset($_GET['organizationId'])) {
            // Get submissions by organization
            if ($user['role'] !== 'Admin' && $user['role'] !== 'OSAS' && $_GET['organizationId'] !== $user['organizationId']) {
                $response = ['success' => false, 'error' => 'Unauthorized: Cannot view submissions from another organization'];
            } else {
                $response = $controller->getByOrganization($_GET['organizationId']);
            }
        } elseif (isset($_GET['academicYear']) && isset($_GET['semester'])) {
            // Get submissions by academic year and semester
            $response = $controller->getByYearSemester($_GET['academicYear'], $_GET['semester']);
        } else {
            // Get all submissions
            if ($user['role'] !== 'Admin' && $user['role'] !== 'OSAS') {
                $response = $controller->getByOrganization($user['organizationId']);
            } else {
                $response = $controller->getAll();
            }
        }
    } elseif ($method === 'POST') {
        // Get request body
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (isset($data['action']) && $data['action'] === 'addRevision') {
            // Only OSAS can add revisions 
            if (strtolower($user['role']) !== 'osas') {
                $response = ['success' => false, 'error' => 'Unauthorized: Only OSAS can add revisions'];
            } else {
                // Update the submission with the revision comment
                $updateData = [
                    'revisionComment' => $data['revisionComment'] ?? '',
                    'revisionDate' => date('Y-m-d H:i:s'),
                    'revisionBy' => $user['name'] ?? $user['email'] ?? 'OSAS'
                ];
                $result = $controller->update($data['submissionId'], $updateData);
                
                if ($result['success']) {
                    $response = ['success' => true, 'message' => 'Revision added successfully'];
                } else {
                    $response = ['success' => false, 'error' => $result['error'] ?? 'Failed to add revision'];
                }
            }
        } else {
            // Check authorization for creating submission
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
        }
    } elseif ($method === 'PUT') {
        // Users can update their own organization's submissions
        if (!isset($_GET['id'])) {
            $response = ['success' => false, 'error' => 'ID required'];
        } else {
            // Verify authorization if not admin/OSAS
            if ($user['role'] !== 'Admin' && $user['role'] !== 'OSAS') {
                // Get submission to check organization ownership
                $submissionData = $controller->getById($_GET['id']);
                
                // Extract organization ID from submission 
                $submissionOrgId = null;
                if (isset($submissionData['data']['organizationId'])) {
                    $submissionOrgId = $submissionData['data']['organizationId'];
                } elseif (isset($submissionData['data']['orgInfo']['orgId'])) {
                    $submissionOrgId = $submissionData['data']['orgInfo']['orgId'];
                }
                
                // Deny update if submission not found or belongs to different organization
                if (!$submissionData['success'] || $submissionOrgId !== $user['organizationId']) {
                    $response = ['success' => false, 'error' => 'Unauthorized: Cannot update submissions from another organization'];
                } else {
                    // Update the submission
                    $data = json_decode(file_get_contents('php://input'), true);
                    $response = $controller->update($_GET['id'], $data);
                }
            } else {
                // Admin/OSAS can update any submission
                $data = json_decode(file_get_contents('php://input'), true);
                $response = $controller->update($_GET['id'], $data);
            }
        }
    }
} catch (Exception $e) {
    // Handle any exceptions
    $response = ['success' => false, 'error' => $e->getMessage()];
}

// Return JSON response
echo json_encode($response);
?>

<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) session_start();

// Load controllers and middleware
require_once __DIR__ . '/../controllers/OrganizationController.php';
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

// Require authentication for all organization operations
$user = AuthMiddleware::requireLogin();

// Initialize controller and get request method
$controller = new OrganizationController();
$method = $_SERVER['REQUEST_METHOD'];
$response = [];

try {
    // Handle GET requests
    if ($method === 'GET') {
        // Check if any filter parameters are present
        $hasFilterParams = isset($_GET['search']) || isset($_GET['school']) || isset($_GET['acronym']) || isset($_GET['id']) || isset($_GET['limit']) || isset($_GET['offset']);
        
        // Route to filtered search if filters present, otherwise get all
        if ($hasFilterParams) {
            $response = $controller->getFiltered($_GET);
        } else {
            $response = $controller->getAll();
        }
    }
} catch (Exception $e) {
    // Handle any exceptions
    $response = ['success' => false, 'error' => $e->getMessage()];
}

// Return JSON response
echo json_encode($response);
?>

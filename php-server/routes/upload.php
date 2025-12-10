<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) session_start();

// Load file upload service, submission model, and authentication middleware
require_once __DIR__ . '/../middleware/FileUploadService.php';
require_once __DIR__ . '/../models/Submission.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Set JSON response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Require authentication for file uploads
$user = AuthMiddleware::requireLogin();

// Initialize response array
$response = [];

try {
    // Handle file upload requests
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Check if files are present
        if (empty($_FILES)) {
            $response = ['success' => false, 'error' => 'No files provided'];
        } else {
            // Get organization acronym and submission ID from request
            $orgAcronym = $_POST['orgAcronym'] ?? '';
            $submissionId = $_POST['submissionId'] ?? null;

            // Validate organization acronym is provided
            if (empty($orgAcronym)) {
                $response = ['success' => false, 'error' => 'Organization acronym is required'];
            } else {
                // Initialize file upload service
                // Upload files to organization folder
                $uploadService = new FileUploadService();
                $uploadResult = $uploadService->uploadFiles($_FILES, $orgAcronym, $submissionId);

                // Check if all files uploaded successfully
                if (empty($uploadResult['errors'])) {
                    // Update submission with file paths if submission ID provided
                    if ($submissionId && !empty($uploadResult['paths'])) {
                        $submissionModel = new Submission();
                        $submissionModel->addFilePaths($submissionId, $uploadResult['paths']);
                    }

                    // Return success response
                    $response = [
                        'success' => true,
                        'files' => $uploadResult['success'],
                        'paths' => $uploadResult['paths'],
                        'message' => count($uploadResult['success']) . ' file(s) uploaded successfully'
                    ];
                } else {
                    // Handle partial success - some files uploaded, some failed
                    $response = [
                        'success' => count($uploadResult['success']) > 0,
                        'errors' => $uploadResult['errors'],
                        'files' => $uploadResult['success'],
                        'paths' => $uploadResult['paths'],
                        'message' => empty($uploadResult['success']) 
                            ? 'All files failed to upload' 
                            : count($uploadResult['success']) . ' file(s) uploaded, some failed'
                    ];

                    // Update submission with successfully uploaded paths even on partial failure
                    if ($submissionId && !empty($uploadResult['paths'])) {
                        $submissionModel = new Submission();
                        $submissionModel->addFilePaths($submissionId, $uploadResult['paths']);
                    }
                }
            }
        }
    } else {
        // Return error for non-POST requests
        $response = ['success' => false, 'error' => 'Invalid request method'];
    }
} catch (Exception $e) {
    // Handle any exceptions and return error
    $response = ['success' => false, 'error' => $e->getMessage()];
}

// Return JSON response
echo json_encode($response);
?>

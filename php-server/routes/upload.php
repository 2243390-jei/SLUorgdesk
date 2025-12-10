<?php
if (session_status() === PHP_SESSION_NONE) session_start();

require_once __DIR__ . '/../middleware/FileUploadService.php';
require_once __DIR__ . '/../models/Submission.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Require authentication
$user = AuthMiddleware::requireLogin();

$response = [];

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Check if files are present
        if (empty($_FILES)) {
            $response = ['success' => false, 'error' => 'No files provided'];
        } else {
            // Get organization acronym from request
            $orgAcronym = $_POST['orgAcronym'] ?? '';
            $submissionId = $_POST['submissionId'] ?? null;

            if (empty($orgAcronym)) {
                $response = ['success' => false, 'error' => 'Organization acronym is required'];
            } else {
                // Use FileUploadService to handle uploads
                $uploadService = new FileUploadService();
                $uploadResult = $uploadService->uploadFiles($_FILES, $orgAcronym, $submissionId);

                if (empty($uploadResult['errors'])) {
                    // Update submission document with file paths
                    if ($submissionId && !empty($uploadResult['paths'])) {
                        $submissionModel = new Submission();
                        $submissionModel->addFilePaths($submissionId, $uploadResult['paths']);
                    }

                    $response = [
                        'success' => true,
                        'files' => $uploadResult['success'],
                        'paths' => $uploadResult['paths'],
                        'message' => count($uploadResult['success']) . ' file(s) uploaded successfully'
                    ];
                } else {
                    // Partial success - still return paths for successfully uploaded files
                    $response = [
                        'success' => count($uploadResult['success']) > 0,
                        'errors' => $uploadResult['errors'],
                        'files' => $uploadResult['success'],
                        'paths' => $uploadResult['paths'],
                        'message' => empty($uploadResult['success']) 
                            ? 'All files failed to upload' 
                            : count($uploadResult['success']) . ' file(s) uploaded, some failed'
                    ];

                    // Update submission with successfully uploaded paths
                    if ($submissionId && !empty($uploadResult['paths'])) {
                        $submissionModel = new Submission();
                        $submissionModel->addFilePaths($submissionId, $uploadResult['paths']);
                    }
                }
            }
        }
    } else {
        $response = ['success' => false, 'error' => 'Invalid request method'];
    }
} catch (Exception $e) {
    $response = ['success' => false, 'error' => $e->getMessage()];
}

echo json_encode($response);
?>

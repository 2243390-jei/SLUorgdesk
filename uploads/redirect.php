<?php
// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Get the requested path from URL rewrite
$requestPath = $_GET['path'] ?? '';

// Handle empty path
if (empty($requestPath)) {
    header('Location: ../index.php');
    exit();
}

$requestPath = ltrim($requestPath, '/');

// Check if user is logged in
if (empty($_SESSION['user']) || empty($_SESSION['logged_in'])) {
    header('Location: ../index.php');
    exit();
}

$user = $_SESSION['user'];
$userRole = strtolower($user['role'] ?? '');

// Allow admin, osas, and organization roles
if (!in_array($userRole, ['osas', 'admin', 'organization'])) {
    header('Location: ../index.php');
    exit();
}

// Organization users can only access their own folder
if ($userRole === 'organization') {
    require_once __DIR__ . '/../php-server/models/Organization.php';
    
    $organizationId = $user['organizationId'] ?? null;
    if (!$organizationId) {
        http_response_code(403);
        exit();
    }

    try {
        $orgModel = new Organization();
        $org = $orgModel->getById($organizationId);
        
        if (!$org) {
            http_response_code(403);
            exit();
        }

        $orgAcronym = strtolower($org['acronym'] ?? '');
        if (empty($orgAcronym) || !preg_match('~^' . preg_quote($orgAcronym) . '(\/|$)~i', $requestPath)) {
            http_response_code(403);
            exit();
        }
    } catch (Exception $e) {
        http_response_code(403);
        exit();
    }
}

// Build file path
$filePath = __DIR__ . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $requestPath);
$realPath = realpath($filePath);
$uploadsDir = realpath(__DIR__);

// Security check: file must exist and be within uploads directory
if (!$realPath || !file_exists($realPath) || strpos($realPath, $uploadsDir) !== 0) {
    http_response_code(404);
    exit();
}

// Only serve files, not directories
if (!is_file($realPath)) {
    http_response_code(403);
    exit();
}

// Determine MIME type
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $realPath);
finfo_close($finfo);
if (!$mimeType) {
    $mimeType = 'application/octet-stream';
}

// Serve the file
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($realPath));
readfile($realPath);
exit();
?>
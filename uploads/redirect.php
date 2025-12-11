<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$requestPath = $_GET['path'] ?? '';
if (empty($requestPath)) {
    header('Location: ../index.php');
    exit();
}

$requestPath = ltrim($requestPath, '/');

if (empty($_SESSION['user']) || empty($_SESSION['logged_in'])) {
    header('Location: ../index.php');
    exit();
}

$user = $_SESSION['user'];
$userRole = strtolower($user['role'] ?? '');

if (!in_array($userRole, ['osas', 'admin', 'organization'])) {
    header('Location: ../index.php');
    exit();
}

error_log("=== UPLOAD AUTH DEBUG ===");
error_log("Role: " . $userRole);
error_log("Request Path: " . $requestPath);

if ($userRole === 'organization') {
    require_once __DIR__ . '/../php-server/models/Organization.php';
    
    $organizationId = $user['organizationId'] ?? null;
    error_log("Organization ID: " . ($organizationId ?? 'MISSING'));
    
    if (!$organizationId) {
        error_log("ERROR: No organizationId in session");
        header('Location: ../index.php');
        exit();
    }

    try {
        $orgModel = new Organization();
        $org = $orgModel->getById($organizationId);
        
        if (!$org) {
            error_log("ERROR: Organization not found for ID: " . $organizationId);
            header('Location: ../index.php');
            exit();
        }

        $orgAcronym = strtolower($org['acronym'] ?? '');
        error_log("Organization Acronym: " . ($orgAcronym ?? 'MISSING'));
        
        if (empty($orgAcronym)) {
            error_log("ERROR: Organization has no acronym");
            header('Location: ../index.php');
            exit();
        }

        $pathStartsWithAcronym = preg_match('~^' . preg_quote($orgAcronym) . '(\/|$)~i', $requestPath);
        $pathContainsOrgId = strpos(strtolower($requestPath), strtolower($organizationId)) !== false;
        
        error_log("Path starts with acronym: " . ($pathStartsWithAcronym ? 'YES' : 'NO'));
        error_log("Path contains orgId: " . ($pathContainsOrgId ? 'YES' : 'NO'));
        
        if (!$pathStartsWithAcronym && !$pathContainsOrgId) {
            error_log("ERROR: Access denied - path doesn't match acronym or orgId");
            http_response_code(403);
            exit();
        }
    } catch (Exception $e) {
        error_log("ERROR: Exception - " . $e->getMessage());
        header('Location: ../index.php');
        exit();
    }
}

$filePath = __DIR__ . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $requestPath);
$realPath = realpath($filePath);
$uploadsDir = realpath(__DIR__);

error_log("File Path: " . $filePath);
error_log("Real Path: " . ($realPath ?? 'NULL'));
error_log("Uploads Dir: " . $uploadsDir);
error_log("File exists: " . (file_exists($filePath) ? 'YES' : 'NO'));

if (!$realPath || !file_exists($realPath)) {
    error_log("ERROR: File not found at: " . $filePath);
    http_response_code(404);
    exit();
}

if (strpos(realpath($realPath), realpath($uploadsDir)) !== 0) {
    error_log("ERROR: Path traversal detected");
    http_response_code(403);
    exit();
}

if (is_file($realPath)) {
    error_log("SUCCESS: Serving file");
    $mimeType = mime_content_type($realPath);
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . filesize($realPath));
    readfile($realPath);
    exit();
}

error_log("ERROR: Not a file (probably directory)");
http_response_code(403);
exit();

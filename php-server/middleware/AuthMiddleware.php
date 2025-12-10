<?php
class AuthMiddleware {
    public static function requireLogin() {
        // Start session if not already started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Check if user is logged in
        if (empty($_SESSION['logged_in']) || empty($_SESSION['user'])) {
            // Return 401 if not authenticated
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized: Please log in']);
            exit;
        }

        // Return user session data
        return $_SESSION['user'];
    }

    public static function requireRole($role) {
        // Get logged in user
        $user = self::requireLogin();

        // Check if user has required role
        if (strtolower($user['role'] ?? '') !== strtolower($role)) {
            // Return 403 if role doesn't match
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Forbidden: Insufficient permissions']);
            exit;
        }

        // Return user if authorization passed
        return $user;
    }
}
?>

<?php
class AuthMiddleware {
    public static function requireLogin() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($_SESSION['logged_in']) || empty($_SESSION['user'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized: Please log in']);
            exit;
        }

        return $_SESSION['user'];
    }

    public static function requireRole($role) {
        $user = self::requireLogin();

        if (strtolower($user['role'] ?? '') !== strtolower($role)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Forbidden: Insufficient permissions']);
            exit;
        }

        return $user;
    }
}
?>

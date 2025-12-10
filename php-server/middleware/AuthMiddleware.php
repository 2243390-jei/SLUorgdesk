<?php
 //Authentication & Authorization Middleware
class AuthMiddleware
{
    /**
     * Require user to be logged in
     * Returns user data if authenticated, exits if not
     */
    public static function requireLogin()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($_SESSION['logged_in']) || empty($_SESSION['user'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Unauthorized: Please log in first'
            ]);
            exit;
        }

        return $_SESSION['user'];
    }

    /**
     * Require user to have a specific role
     */
    public static function requireRole($role)
    {
        $user = self::requireLogin();

        if (strtolower($user['role'] ?? '') !== strtolower($role)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Forbidden: Insufficient permissions'
            ]);
            exit;
        }

        return $user;
    }

}
?>

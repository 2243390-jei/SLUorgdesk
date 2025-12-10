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

    /**
     * Require user to be admin or OSAS
     */
    public static function requireAdminOrOsas()
    {
        $user = self::requireLogin();
        $role = strtolower($user['role'] ?? '');

        if ($role !== 'admin' && $role !== 'osas') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Forbidden: Admin or OSAS access required'
            ]);
            exit;
        }

        return $user;
    }

    /**
     * Require user to own the resource (organization)
     */
    public static function requireOrgOwnership($orgId)
    {
        $user = self::requireLogin();

        // Admin can access anything
        if (strtolower($user['role'] ?? '') === 'admin') {
            return $user;
        }

        // Organization users can only access their own org
        if (strtolower($user['role'] ?? '') === 'organization') {
            if ($user['organizationId'] !== $orgId) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Forbidden: Cannot access other organizations'
                ]);
                exit;
            }
        }

        return $user;
    }
}
?>

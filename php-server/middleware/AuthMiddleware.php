<?php
class AuthMiddleware {
    const SESSION_TIMEOUT = 1800; // 30 minutes

    public static function requireLogin() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Check for session timeout
        self::checkSessionTimeout();

        if (empty($_SESSION['logged_in']) || empty($_SESSION['user'])) {
            header('Location: ../../index.php');
            exit;
        }

        return $_SESSION['user'];
    }

    public static function checkSessionTimeout() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // If user is logged in, check activity time
        if (!empty($_SESSION['user'])) {
            if (isset($_SESSION['last_activity'])) {
                $inactivity = time() - $_SESSION['last_activity'];
                
                if ($inactivity > self::SESSION_TIMEOUT) {
                    // Session has timed out - destroy and redirect to logout modal
                    session_unset();
                    session_destroy();
                    header('Location: ../../index.php');
                    exit;
                }
            }
            
            // Update last activity time
            $_SESSION['last_activity'] = time();
        }
    }

    public static function requireRole($role) {
        $user = self::requireLogin();

        if (strtolower($user['role'] ?? '') !== strtolower($role)) {
            header('Location: ../../index.php');
            exit;
        }

        return $user;
    }
}
?>

<?php
class AuthMiddleware {
    public static function requireLogin() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($_SESSION['logged_in']) || empty($_SESSION['user'])) {
            header('Location: ../../index.php');
            exit;
        }

        return $_SESSION['user'];
    }

    public static function requireRole($role) {
        $user = self::requireLogin();

        if (strtolower($user['role'] ?? '') !== strtolower($role)) {
            header('Location: ../../index.php');
            exit;
        }

        return $user;
    }

    public static function isOSAS() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        return !empty($_SESSION['user']) && strtolower($_SESSION['user']['role'] ?? '') === 'osas';
    }

    public static function isOrganization() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        return !empty($_SESSION['user']) && strtolower($_SESSION['user']['role'] ?? '') === 'organization';
    }

    public static function isAdmin() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        return !empty($_SESSION['user']) && strtolower($_SESSION['user']['role'] ?? '') === 'admin';
    }
}
?>

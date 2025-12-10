<?php
require_once __DIR__ . '/../models/User.php';

class AuthController {
    private $userModel;

    public function __construct() {
        // Initialize user model
        $this->userModel = new User();
    }

    public function validateLogin(array $data) {
        // Extract and sanitize email and password
        $email = isset($data['email']) ? strtolower(trim($data['email'])) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        // Validate email and password are provided
        if (empty($email) || empty($password)) {
            return ['success' => false, 'error' => 'Email and password are required'];
        }

        // Get user from database with password
        $user = $this->userModel->getByEmail($email, true);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found'];
        }

        // Verify password matches
        if (($user['password'] ?? '') !== $password) {
            return ['success' => false, 'error' => 'Invalid password'];
        }

        // Remove password from response
        unset($user['password']);
        return ['success' => true, 'data' => $user];
    }
}
?>
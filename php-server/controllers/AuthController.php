<?php
require_once __DIR__ . '/../models/User.php';

class AuthController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function validateLogin(array $data) {
        $email = isset($data['email']) ? strtolower(trim($data['email'])) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        if (empty($email) || empty($password)) {
            return ['success' => false, 'error' => 'Email and password are required'];
        }

        $user = $this->userModel->getByEmail($email, true);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found'];
        }

        if (($user['password'] ?? '') !== $password) {
            return ['success' => false, 'error' => 'Invalid password'];
        }

        unset($user['password']);
        return ['success' => true, 'data' => $user];
    }
}
?>
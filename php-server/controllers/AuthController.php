<?php
require_once __DIR__ . '/../models/User.php';

class AuthController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    // Validate login credentials and return response array
    public function loginFromData(array $data) {
        $email = isset($data['email']) ? strtolower(trim($data['email'])) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        if ($email === '' || $password === '') {
            return ['success' => false, 'error' => 'Email and password are required'];
        }

        // Fetch user by email (include password for verification)
        $user = $this->userModel->getByEmail($email, true);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found'];
        }

        // TODO: Make password Hash
        $stored = $user['password'] ?? '';
        if ($stored !== $password) {
            return ['success' => false, 'error' => 'Invalid password'];
        }

        // Remove password from response
        unset($user['password']);

        return ['success' => true, 'data' => $user];
    }

    // Helper for JSON responses
    public function jsonResponse($arr) {
        header('Content-Type: application/json');
        echo json_encode($arr);
        exit;
    }
}
?>
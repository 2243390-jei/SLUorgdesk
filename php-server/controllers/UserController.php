<?php
require_once __DIR__ . '/../models/User.php';

class UserController {
    private $user;

    public function __construct() {
        // Initialize user model
        $this->user = new User();
    }

    public function getById($id) {
        // Fetch user by ID
        $data = $this->user->getById($id);
        return $data ? ['success' => true, 'data' => $data] : ['success' => false, 'error' => 'User not found'];
    }

    public function getByRole($role) {
        // Get pagination params with defaults
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        // Fetch users by role
        return ['success' => true, 'data' => $this->user->getByRole($role, $limit, $offset)];
    }

    public function getByEmail($email) {
        // Fetch user by email
        $data = $this->user->getByEmail($email);
        return $data ? ['success' => true, 'data' => $data] : ['success' => false, 'error' => 'User not found'];
    }

    public function authenticate($email, $password) {
        // Validate credentials provided
        if (empty($email) || empty($password)) {
            return ['success' => false, 'error' => 'Email and password are required'];
        }

        // Get user with password for verification
        $user = $this->user->getByEmail($email, true);
        if (!$user || ($user['password'] ?? '') !== $password) {
            return ['success' => false, 'error' => 'Invalid credentials'];
        }

        // Normalize user data for response
        $role = $user['role'] ?? '';
        $normalized = [
            '_id' => (string)($user['_id'] ?? ''),
            'email' => $user['email'] ?? '',
            'name' => $user['name'] ?? '',
            'role' => $role,
            'isActive' => $user['isActive'] ?? true
        ];

        // Add organization ID if user is organization role
        if (strtolower($role) === 'organization' && !empty($user['organization'])) {
            $orgId = $user['organization'];
            $normalized['organizationId'] = is_array($orgId) && isset($orgId['$oid']) ? $orgId['$oid'] : (string)$orgId;
        }

        return ['success' => true, 'data' => $normalized];
    }
}
?>

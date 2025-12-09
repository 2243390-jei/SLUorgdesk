<?php
require_once __DIR__ . '/../models/User.php';

/**
 * User Controller
 */
class UserController
{
    private $user;

    public function __construct()
    {
        $this->user = new User();
    }

    /**
     * Get all users
     */
    public function getAll()
    {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $data = $this->user->getAll($limit, $offset);
        return ['success' => true, 'data' => $data];
    }

    /**
     * Get user by ID
     */
    public function getById($id)
    {
        $data = $this->user->getById($id);
        if (!$data) {
            return ['success' => false, 'error' => 'User not found'];
        }
        return ['success' => true, 'data' => $data];
    }

    /**
     * Get users by role
     */
    public function getByRole($role)
    {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $data = $this->user->getByRole($role, $limit, $offset);
        return ['success' => true, 'data' => $data];
    }

    /**
     * Get user by email
     */
    public function getByEmail($email)
    {
        $data = $this->user->getByEmail($email);
        if (!$data) {
            return ['success' => false, 'error' => 'User not found'];
        }
        return ['success' => true, 'data' => $data];
    }

    /**
     * Create user
     */
    public function create($data)
    {
        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            return ['success' => false, 'error' => 'Missing required fields'];
        }

        $id = $this->user->create($data);
        return ['success' => true, 'id' => (string)$id];
    }

    /**
     * Update user
     */
    public function update($id, $data)
    {
        $result = $this->user->update($id, $data);
        if (!$result) {
            return ['success' => false, 'error' => 'Update failed'];
        }
        return ['success' => true];
    }

    /**
     * Delete user
     */
    public function delete($id)
    {
        $result = $this->user->delete($id);
        if (!$result) {
            return ['success' => false, 'error' => 'Delete failed'];
        }
        return ['success' => true];
    }

    /**
     * Authenticate user with email and password
     */
    public function authenticate($email, $password)
    {
        if (empty($email) || empty($password)) {
            return ['success' => false, 'error' => 'Email and password are required'];
        }

        $user = $this->user->getByEmailWithPassword($email);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found'];
        }

        // Verify password matches
        if (($user['password'] ?? '') !== $password) {
            return ['success' => false, 'error' => 'Invalid password'];
        }

        // Return normalized user data (without password, clean fields)
        $role = $user['role'] ?? '';
        $normalized = [
            '_id' => (string)($user['_id'] ?? ''),
            'email' => $user['email'] ?? '',
            'name' => $user['name'] ?? '',
            'role' => $role,
            'isActive' => $user['isActive'] ?? true
        ];

        // If Organization role, add organizationId (extract from 'organization' field)
        if (strtolower($role) === 'organization' && !empty($user['organization'])) {
            $orgId = $user['organization'];
            if (is_array($orgId) && isset($orgId['$oid'])) {
                $normalized['organizationId'] = $orgId['$oid'];
            } else {
                $normalized['organizationId'] = (string)$orgId;
            }
        }

        return ['success' => true, 'data' => $normalized];
    }
}
?>

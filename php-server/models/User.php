<?php
require_once __DIR__ . '/../database/dbAccess.php';

/**
 * User Model
 */
class User
{
    private $collection = 'User';

    /**
     * Get all users with selected fields
     */
    public function getAll($limit = 50, $offset = 0)
    {
        $options = [
            'skip' => $offset,
            'limit' => $limit,
            'projection' => [
                '_id' => 1,
                'name' => 1,
                'email' => 1,
                'role' => 1,
                'studentId' => 1,
                'school' => 1,
                'isActive' => 1,
                'createdAt' => 1
            ]
        ];

        $cursor = Database::query($this->collection, [], $options);
        return $this->cursorToArray($cursor);
    }

    /**
     * Get user by ID
     */
    public function getById($id, $includePassword = false)
    {
        try {
            $objectId = new MongoDB\BSON\ObjectId($id);
            $projection = [
                '_id' => 1,
                'name' => 1,
                'email' => 1,
                'role' => 1,
                'studentId' => 1,
                'school' => 1,
                'course' => 1,
                'yearLevel' => 1,
                'isActive' => 1,
                'organizations' => 1,
                'createdAt' => 1
            ];

            if ($includePassword) {
                $projection['password'] = 1;
            }

            $options = ['projection' => $projection];

            $cursor = Database::query($this->collection, ['_id' => $objectId], $options);
            $result = $cursor->toArray();
            return !empty($result) ? $this->formatDocument($result[0]) : null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Get users by role
     */
    public function getByRole($role, $limit = 50, $offset = 0)
    {
        $options = [
            'skip' => $offset,
            'limit' => $limit,
            'projection' => [
                '_id' => 1,
                'name' => 1,
                'email' => 1,
                'studentId' => 1,
                'school' => 1,
                'isActive' => 1
            ]
        ];

        $cursor = Database::query($this->collection, ['role' => $role], $options);
        return $this->cursorToArray($cursor);
    }

    /**
     * Get user by email
     */
    public function getByEmail($email, $includePassword = false)
    {
        $projection = [
            '_id' => 1,
            'name' => 1,
            'email' => 1,
            'role' => 1,
            'isActive' => 1,
            'organization' => 1
        ];

        if ($includePassword) {
            $projection['password'] = 1;
        }

        $options = [
            'projection' => $projection
        ];

        $cursor = Database::query($this->collection, ['email' => $email], $options);
        $result = $cursor->toArray();
        return !empty($result) ? $this->formatDocument($result[0]) : null;
    }

    /**
     * Get user by email with password (for authentication)
     */
    public function getByEmailWithPassword($email)
    {
        return $this->getByEmail($email, true);
    }

    /**
     * Create user
     */
    public function create($data)
    {
        $document = [
            'name' => $data['name'] ?? null,
            'email' => $data['email'] ?? null,
            'password' => $data['password'] ?? null,
            'role' => $data['role'] ?? 'student',
            'studentId' => $data['studentId'] ?? null,
            'school' => $data['school'] ?? null,
            'course' => $data['course'] ?? null,
            'yearLevel' => $data['yearLevel'] ?? null,
            'isActive' => $data['isActive'] ?? true,
            'createdAt' => new MongoDB\BSON\UTCDateTime(time() * 1000)
        ];

        return Database::insert($this->collection, $document);
    }

    /**
     * Update user
     */
    public function update($id, $data)
    {
        try {
            $objectId = new MongoDB\BSON\ObjectId($id);
            $data['updatedAt'] = new MongoDB\BSON\UTCDateTime(time() * 1000);
            return Database::update($this->collection, ['_id' => $objectId], $data);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Delete user
     */
    public function delete($id)
    {
        try {
            $objectId = new MongoDB\BSON\ObjectId($id);
            return Database::delete($this->collection, ['_id' => $objectId]);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Convert BSON cursor to array
     */
    private function cursorToArray($cursor)
    {
        $results = [];
        foreach ($cursor as $document) {
            $results[] = $this->formatDocument($document);
        }
        return $results;
    }

    /**
     * Format BSON document to array
     */
    private function formatDocument($document)
    {
        $doc = json_decode(json_encode($document), true);
        if (isset($doc['_id']) && is_array($doc['_id']) && isset($doc['_id']['$oid'])) {
            $doc['_id'] = $doc['_id']['$oid'];
        }
        return $doc;
    }
}
?>

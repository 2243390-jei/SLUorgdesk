<?php
require_once __DIR__ . '/../database/dbAccess.php';

class User {
    private $collection = 'User';

    public function getById($id, $includePassword = false) {
        try {
            $objectId = new MongoDB\BSON\ObjectId($id);
            $projection = [
                '_id' => 1, 'name' => 1, 'email' => 1, 'role' => 1, 'studentId' => 1,
                'school' => 1, 'course' => 1, 'yearLevel' => 1, 'isActive' => 1,
                'organizations' => 1, 'createdAt' => 1
            ];
            if ($includePassword) $projection['password'] = 1;

            $cursor = Database::query($this->collection, ['_id' => $objectId], ['projection' => $projection]);
            $result = $cursor->toArray();
            return !empty($result) ? $this->formatDocument($result[0]) : null;
        } catch (Exception $e) {
            return null;
        }
    }

    public function getByRole($role, $limit = 50, $offset = 0) {
        $options = [
            'skip' => $offset, 'limit' => $limit,
            'projection' => ['_id' => 1, 'name' => 1, 'email' => 1, 'studentId' => 1, 'school' => 1, 'isActive' => 1]
        ];
        $cursor = Database::query($this->collection, ['role' => $role], $options);
        return $this->cursorToArray($cursor);
    }

    public function getByEmail($email, $includePassword = false) {
        $projection = ['_id' => 1, 'name' => 1, 'email' => 1, 'role' => 1, 'isActive' => 1, 'organization' => 1];
        if ($includePassword) $projection['password'] = 1;

        $cursor = Database::query($this->collection, ['email' => $email], ['projection' => $projection]);
        $result = $cursor->toArray();
        return !empty($result) ? $this->formatDocument($result[0]) : null;
    }

    private function cursorToArray($cursor) {
        $results = [];
        foreach ($cursor as $document) {
            $results[] = $this->formatDocument($document);
        }
        return $results;
    }

    private function formatDocument($document) {
        $doc = json_decode(json_encode($document), true);
        if (isset($doc['_id']['$oid'])) {
            $doc['_id'] = $doc['_id']['$oid'];
        }
        return $doc;
    }
}
?>

<?php
require_once __DIR__ . '/../database/dbAccess.php';

class Organization {
    private $collection = 'Organizations';

    public function getAll($limit = 50, $offset = 0) {
        // Define query options with pagination and projection
        $options = [
            'skip' => $offset, 'limit' => $limit,
            'projection' => ['_id' => 1, 'name' => 1, 'acronym' => 1, 'school' => 1,
                'localLogoPath' => 1, 'email' => 1, 'isWhitelisted' => 1, 'createdAt' => 1]
        ];
        // Query all organizations
        $cursor = Database::query($this->collection, [], $options);
        // Convert cursor to array
        return $this->cursorToArray($cursor);
    }

    public function getById($id) {
        try {
            // Convert string ID to MongoDB ObjectId
            $objectId = new MongoDB\BSON\ObjectId($id);
            // Define query options
            $options = [
                'projection' => ['_id' => 1, 'name' => 1, 'acronym' => 1, 'school' => 1,
                    'localLogoPath' => 1, 'email' => 1, 'isWhitelisted' => 1, 'members' => 1, 'createdAt' => 1]
            ];
            // Query organization by ID
            $cursor = Database::query($this->collection, ['_id' => $objectId], $options);
            $result = $cursor->toArray();
            // Return formatted document or null
            return !empty($result) ? $this->formatDocument($result[0]) : null;
        } catch (Exception $e) {
            return null;
        }
    }

    public function getFiltered($filters = [], $limit = 100, $offset = 0) {
        // Initialize filter and clauses
        $mongoFilter = [];
        $and = [];

        // Build ID filter if provided
        if (!empty($filters['id'])) {
            $id = $filters['id'];
            $and[] = $this->buildIdFilter($id);
        }
        // Add acronym filter
        if (!empty($filters['acronym'])) {
            $and[] = ['acronym' => $filters['acronym']];
        }
        // Add school filter
        if (!empty($filters['school'])) {
            $and[] = ['school' => $filters['school']];
        }
        // Add search filter with regex
        if (!empty($filters['search'])) {
            $s = trim($filters['search']);
            $regex = new MongoDB\BSON\Regex(preg_quote($s), 'i');
            $and[] = ['$or' => [['name' => $regex], ['acronym' => $regex], ['school' => $regex]]];
        }

        // Combine all filters
        $mongoFilter = (count($and) === 1) ? $and[0] : (empty($and) ? [] : ['$and' => $and]);

        // Define query options
        $options = [
            'skip' => $offset, 'limit' => $limit,
            'projection' => ['_id' => 1, 'name' => 1, 'acronym' => 1, 'school' => 1,
                'localLogoPath' => 1, 'email' => 1, 'isWhitelisted' => 1, 'createdAt' => 1]
        ];
        // Query with filters
        $cursor = Database::query($this->collection, $mongoFilter, $options);
        // Convert cursor to array
        return $this->cursorToArray($cursor);
    }

    private function buildIdFilter($id) {
        // Check if ID is valid ObjectId format
        if (is_string($id) && preg_match('/^[a-f0-9]{24}$/i', $id)) {
            try {
                // Convert string to ObjectId
                return ['_id' => new MongoDB\BSON\ObjectId($id)];
            } catch (Exception $e) {}
        }
        // Return ID as-is if not valid format
        return ['_id' => $id];
    }

    private function cursorToArray($cursor) {
        // Initialize results array
        $results = [];
        // Format each document from cursor
        foreach ($cursor as $document) {
            $results[] = $this->formatDocument($document);
        }
        // Return formatted documents
        return $results;
    }

    private function formatDocument($document) {
        // Convert BSON document to JSON then to array
        $doc = json_decode(json_encode($document), true);
        // Extract ObjectId value
        if (isset($doc['_id']['$oid'])) {
            $doc['_id'] = $doc['_id']['$oid'];
        }
        // Return formatted document
        return $doc;
    }
}
?>

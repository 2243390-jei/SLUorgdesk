<?php
require(__DIR__ . '/../database/dbAccess.php');

/**
 * Organization Model
 */
class Organization
{
    private $collection = 'Organizations';

    /**
     * Get all organizations with selected fields
     */
    public function getAll($limit = 50, $offset = 0)
    {
        $options = [
            'skip' => $offset,
            'limit' => $limit,
            'projection' => [
                '_id' => 1,
                'name' => 1,
                'acronym' => 1,
                'school' => 1,
                'localLogoPath' => 1, 
                'email' => 1,
                'isWhitelisted' => 1,
                'createdAt' => 1
            ]
        ];

        $cursor = Database::query($this->collection, [], $options);
        return $this->cursorToArray($cursor);
    }

    /**
     * Get organization by ID
     */
    public function getById($id)
    {
        try {
            $objectId = new MongoDB\BSON\ObjectId($id);
            $options = [
                'projection' => [
                    '_id' => 1,
                    'name' => 1,
                    'acronym' => 1,
                    'school' => 1,
                     'localLogoPath' => 1,  
                    'email' => 1,
                    'isWhitelisted' => 1,
                    'members' => 1,
                    'createdAt' => 1
                ]
            ];

            $cursor = Database::query($this->collection, ['_id' => $objectId], $options);
            $result = $cursor->toArray();
            return !empty($result) ? $this->formatDocument($result[0]) : null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Create organization
     */
    public function create($data)
    {
        $document = [
            'name' => $data['name'] ?? null,
            'acronym' => $data['acronym'] ?? null,
            'school' => $data['school'] ?? null,
            'localLogoPath' => $data['localLogoPath'] ?? null,  
            'email' => $data['email'] ?? null,
            'isWhitelisted' => $data['isWhitelisted'] ?? false,
            'createdAt' => new MongoDB\BSON\UTCDateTime(time() * 1000)
        ];

        return Database::insert($this->collection, $document);
    }

    /**
     * Update organization
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
     * Delete organization
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
     * Get organizations by flexible filters:
     * $filters = [
     *   'id' => string,
     *   'search' => string,
     *   'school' => string,
     *   'acronym' => string
     * ]
     */
    public function getFiltered($filters = [], $limit = 100, $offset = 0)
    {
        $mongoFilter = [];
        $and = [];

        if (!empty($filters['id'])) {
            $id = $filters['id'];
            if (is_string($id) && preg_match('/^[a-f0-9]{24}$/i', $id)) {
                try { $oid = new MongoDB\BSON\ObjectId($id); $and[] = ['_id' => $oid]; }
                catch (Exception $e) { $and[] = ['_id' => $id]; }
            } else {
                $and[] = ['_id' => $id];
            }
        }

        if (!empty($filters['acronym'])) {
            $and[] = ['acronym' => $filters['acronym']];
        }

        if (!empty($filters['school'])) {
            $and[] = ['school' => $filters['school']];
        }

        if (!empty($filters['search'])) {
            $s = trim($filters['search']);
            $regex = new MongoDB\BSON\Regex(preg_quote($s), 'i');
            $and[] = ['$or' => [
                ['name' => $regex],
                ['acronym' => $regex],
                ['school' => $regex]
            ]];
        }

        if (!empty($and)) {
            $mongoFilter = (count($and) === 1) ? $and[0] : ['$and' => $and];
        } else {
            $mongoFilter = [];
        }

        $options = [
            'skip' => $offset,
            'limit' => $limit,
            'projection' => [
                '_id' => 1,
                'name' => 1,
                'acronym' => 1,
                'school' => 1,
                'localLogoPath' => 1,
                'email' => 1,
                'isWhitelisted' => 1,
                'createdAt' => 1
            ]
        ];

        $cursor = Database::query($this->collection, $mongoFilter, $options);
        return $this->cursorToArray($cursor);
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

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

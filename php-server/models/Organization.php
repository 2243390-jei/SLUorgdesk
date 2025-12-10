<?php
require __DIR__ . '/../database/dbAccess.php';

class Organization {
    private $collection = 'Organizations';

    public function getAll($limit = 50, $offset = 0) {
        $options = [
            'skip' => $offset, 'limit' => $limit,
            'projection' => ['_id' => 1, 'name' => 1, 'acronym' => 1, 'school' => 1,
                'localLogoPath' => 1, 'email' => 1, 'isWhitelisted' => 1, 'createdAt' => 1]
        ];
        $cursor = Database::query($this->collection, [], $options);
        return $this->cursorToArray($cursor);
    }

    public function getById($id) {
        try {
            $objectId = new MongoDB\BSON\ObjectId($id);
            $options = [
                'projection' => ['_id' => 1, 'name' => 1, 'acronym' => 1, 'school' => 1,
                    'localLogoPath' => 1, 'email' => 1, 'isWhitelisted' => 1, 'members' => 1, 'createdAt' => 1]
            ];
            $cursor = Database::query($this->collection, ['_id' => $objectId], $options);
            $result = $cursor->toArray();
            return !empty($result) ? $this->formatDocument($result[0]) : null;
        } catch (Exception $e) {
            return null;
        }
    }

    public function getFiltered($filters = [], $limit = 100, $offset = 0) {
        $mongoFilter = [];
        $and = [];

        if (!empty($filters['id'])) {
            $id = $filters['id'];
            $and[] = $this->buildIdFilter($id);
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
            $and[] = ['$or' => [['name' => $regex], ['acronym' => $regex], ['school' => $regex]]];
        }

        $mongoFilter = (count($and) === 1) ? $and[0] : (empty($and) ? [] : ['$and' => $and]);

        $options = [
            'skip' => $offset, 'limit' => $limit,
            'projection' => ['_id' => 1, 'name' => 1, 'acronym' => 1, 'school' => 1,
                'localLogoPath' => 1, 'email' => 1, 'isWhitelisted' => 1, 'createdAt' => 1]
        ];
        $cursor = Database::query($this->collection, $mongoFilter, $options);
        return $this->cursorToArray($cursor);
    }

    public function create($data) {
        return Database::insert($this->collection, $data);
    }

    public function update($id, $data) {
        try {
            $objectId = new MongoDB\BSON\ObjectId($id);
            return Database::update($this->collection, ['_id' => $objectId], $data);
        } catch (Exception $e) {
            return false;
        }
    }

    public function delete($id) {
        try {
            $objectId = new MongoDB\BSON\ObjectId($id);
            return Database::delete($this->collection, ['_id' => $objectId]);
        } catch (Exception $e) {
            return false;
        }
    }

    private function buildIdFilter($id) {
        if (is_string($id) && preg_match('/^[a-f0-9]{24}$/i', $id)) {
            try {
                return ['_id' => new MongoDB\BSON\ObjectId($id)];
            } catch (Exception $e) {}
        }
        return ['_id' => $id];
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

<?php
require_once __DIR__ . '/../database/dbAccess.php';

class Submission {
    private $collection = 'Submissions';

    public function getAll($limit = 50, $offset = 0) {
        $options = ['skip' => $offset, 'limit' => $limit, 'sort' => ['submittedAt' => -1]];
        $cursor = Database::query($this->collection, [], $options);
        return $this->cursorToArray($cursor);
    }

    public function getById($id) {
        try {
            $objectId = new MongoDB\BSON\ObjectId($id);
            $cursor = Database::query($this->collection, ['_id' => $objectId]);
            $result = $cursor->toArray();
            return !empty($result) ? $this->formatDocument($result[0]) : null;
        } catch (Exception $e) {
            return null;
        }
    }

    public function getByOrganization($orgId, $limit = 50, $offset = 0) {
        try {
            $filter = $this->buildOrgIdFilter($orgId);
            $options = ['skip' => $offset, 'limit' => $limit, 'sort' => ['submittedAt' => -1]];
            $cursor = Database::query($this->collection, $filter, $options);
            return $this->cursorToArray($cursor);
        } catch (Exception $e) {
            return [];
        }
    }

    public function getByYearSemester($year, $semester, $limit = 50, $offset = 0) {
        $options = ['skip' => $offset, 'limit' => $limit, 'sort' => ['submittedAt' => -1]];
        $cursor = Database::query($this->collection, ['academicYear' => $year, 'semester' => $semester], $options);
        return $this->cursorToArray($cursor);
    }

    public function create($data) {
        $eventData = $data['events'] ?? [];
        $eventData = (is_array($eventData) && count($eventData) === 1) ? $eventData[0] : $eventData;

        $document = [
            'applicationInfo' => $data['applicationInfo'] ?? [],
            'orgInfo' => $data['orgInfo'] ?? [],
            'academicYear' => $data['academicYear'] ?? null,
            'semester' => $data['semester'] ?? null,
            'event' => $eventData,
            'revisionComment' => $data['revisionComment'] ?? $data['additionalNote'] ?? '',
            'submittedAt' => new MongoDB\BSON\UTCDateTime(time() * 1000)
        ];

        return Database::insert($this->collection, $document);
    }

    public function addFilePaths($id, $filePaths) {
        try {
            $objectId = new MongoDB\BSON\ObjectId($id);
            $updateData = ['$push' => ['event.supportingDocuments' => ['$each' => $filePaths]]];
            return Database::update($this->collection, ['_id' => $objectId], $updateData);
        } catch (Exception $e) {
            return false;
        }
    }

    public function update($id, $data) {
        try {
            $objectId = new MongoDB\BSON\ObjectId($id);
            $updateDoc = ['$set' => ['updatedAt' => new MongoDB\BSON\UTCDateTime(time() * 1000)]];
            
            foreach ($data as $key => $value) {
                if ($key === 'event' && is_array($value)) {
                    foreach ($value as $eventKey => $eventValue) {
                        $updateDoc['$set']["event.{$eventKey}"] = $eventValue;
                    }
                } else {
                    $updateDoc['$set'][$key] = $value;
                }
            }
            
            return Database::update($this->collection, ['_id' => $objectId], $updateDoc);
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

    public function getFiltered($filters = [], $limit = 500, $offset = 0) {
        $mongoFilter = [];
        $andClauses = [];

        if (!empty($filters['organizationId'])) {
            $andClauses[] = $this->buildOrgIdFilter($filters['organizationId']);
        }
        if (!empty($filters['status'])) {
            $andClauses[] = ['status' => $filters['status']];
        }
        if (!empty($filters['search'])) {
            $s = trim($filters['search']);
            $regex = new MongoDB\BSON\Regex(preg_quote($s), 'i');
            $andClauses[] = ['$or' => [
                ['orgInfo.name' => $regex], ['orgInfo.acronym' => $regex],
                ['event.eventName' => $regex], ['event.eventSDG' => $regex]
            ]];
        }
        if (!empty($filters['month']) && !empty($filters['year'])) {
            $m = str_pad((int)$filters['month'], 2, '0', STR_PAD_LEFT);
            $y = (int)$filters['year'];
            $andClauses[] = ['event.eventDate' => new MongoDB\BSON\Regex("^{$y}-{$m}", 'i')];
        }
        if (!empty($filters['date'])) {
            $d = $filters['date'];
            $dateOr = [['event.eventDate' => $d], ['event.eventDate' => new MongoDB\BSON\Regex("^" . preg_quote($d), 'i')]];
            try {
                $startUTC = new MongoDB\BSON\UTCDateTime(strtotime($d . ' 00:00:00') * 1000);
                $endUTC = new MongoDB\BSON\UTCDateTime(strtotime($d . ' 23:59:59') * 1000);
                $dateOr[] = ['event.eventDate' => ['$gte' => $startUTC, '$lte' => $endUTC]];
            } catch (Exception $e) {}
            $andClauses[] = ['$or' => $dateOr];
        }

        $mongoFilter = (count($andClauses) === 1) ? $andClauses[0] : (empty($andClauses) ? [] : ['$and' => $andClauses]);

        $options = ['skip' => $offset, 'limit' => $limit, 'sort' => ['submittedAt' => -1]];
        $cursor = Database::query($this->collection, $mongoFilter, $options);
        return $this->cursorToArray($cursor);
    }

    private function isDuplicate($data) {
        $orgInfo = $data['orgInfo'] ?? [];
        $orgId = $orgInfo['orgId'] ?? null;
        $academicYear = $data['academicYear'] ?? null;
        $semester = $data['semester'] ?? null;

        if (!$orgId || !$academicYear || !$semester) {
            return false;
        }

        $filter = [
            'orgInfo.orgId' => $orgId,
            'academicYear' => $academicYear,
            'semester' => $semester
        ];

        $cursor = Database::query($this->collection, $filter, ['limit' => 1]);
        $result = $cursor->toArray();
        return !empty($result);
    }

    private function buildOrgIdFilter($orgId) {
        $objectId = null;
        if (is_string($orgId) && preg_match('/^[a-f0-9]{24}$/i', $orgId)) {
            try {
                $objectId = new MongoDB\BSON\ObjectId($orgId);
            } catch (Exception $e) {}
        }
        return ['$or' => [['orgInfo.orgId' => $objectId ?? $orgId], ['orgInfo.orgId' => $orgId]]];
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

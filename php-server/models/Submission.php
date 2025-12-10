<?php
require_once __DIR__ . '/../database/dbAccess.php';

class Submission {
    private $collection = 'Submissions';

    public function getAll($limit = 50, $offset = 0) {
        // Define query options with sorting by submission date
        $options = ['skip' => $offset, 'limit' => $limit, 'sort' => ['submittedAt' => -1]];
        // Query all submissions
        $cursor = Database::query($this->collection, [], $options);
        // Return formatted results
        return $this->cursorToArray($cursor);
    }

    public function getById($id) {
        try {
            // Convert ID to ObjectId
            $objectId = new MongoDB\BSON\ObjectId($id);
            // Query submission by ID
            $cursor = Database::query($this->collection, ['_id' => $objectId]);
            // Get results from cursor
            $result = $cursor->toArray();
            // Return formatted submission or null
            return !empty($result) ? $this->formatDocument($result[0]) : null;
        } catch (Exception $e) {
            return null;
        }
    }

    public function getByOrganization($orgId, $limit = 50, $offset = 0) {
        try {
            // Build organization ID filter
            $filter = $this->buildOrgIdFilter($orgId);
            // Define query options with sorting
            $options = ['skip' => $offset, 'limit' => $limit, 'sort' => ['submittedAt' => -1]];
            // Query submissions by organization
            $cursor = Database::query($this->collection, $filter, $options);
            // Return formatted results
            return $this->cursorToArray($cursor);
        } catch (Exception $e) {
            return [];
        }
    }

    public function getByYearSemester($year, $semester, $limit = 50, $offset = 0) {
        // Define query options with sorting
        $options = ['skip' => $offset, 'limit' => $limit, 'sort' => ['submittedAt' => -1]];
        // Query submissions by academic year and semester
        $cursor = Database::query($this->collection, ['academicYear' => $year, 'semester' => $semester], $options);
        // Return formatted results
        return $this->cursorToArray($cursor);
    }

    public function create($data) {
        // Extract event data from submission
        $eventData = $data['events'] ?? [];
        // Normalize event data to single object if single event
        $eventData = (is_array($eventData) && count($eventData) === 1) ? $eventData[0] : $eventData;

        // Build submission document
        $document = [
            'applicationInfo' => $data['applicationInfo'] ?? [],
            'orgInfo' => $data['orgInfo'] ?? [],
            'academicYear' => $data['academicYear'] ?? null,
            'semester' => $data['semester'] ?? null,
            'event' => $eventData,
            'revisionComment' => $data['revisionComment'] ?? $data['additionalNote'] ?? '',
            'submittedAt' => new MongoDB\BSON\UTCDateTime(time() * 1000)
        ];

        // Insert new submission into database
        return Database::insert($this->collection, $document);
    }

    public function addFilePaths($id, $filePaths) {
        try {
            // Convert ID to ObjectId
            $objectId = new MongoDB\BSON\ObjectId($id);
            // Build update with file paths array push
            $updateData = ['$push' => ['event.supportingDocuments' => ['$each' => $filePaths]]];
            // Update submission with new file paths
            return Database::update($this->collection, ['_id' => $objectId], $updateData);
        } catch (Exception $e) {
            return false;
        }
    }

    public function update($id, $data) {
        try {
            // Convert ID to ObjectId
            $objectId = new MongoDB\BSON\ObjectId($id);
            // Initialize update document with new timestamp
            $updateDoc = ['$set' => ['updatedAt' => new MongoDB\BSON\UTCDateTime(time() * 1000)]];
            
            // Build update fields from data
            foreach ($data as $key => $value) {
                // Handle nested event fields
                if ($key === 'event' && is_array($value)) {
                    foreach ($value as $eventKey => $eventValue) {
                        $updateDoc['$set']["event.{$eventKey}"] = $eventValue;
                    }
                } else {
                    $updateDoc['$set'][$key] = $value;
                }
            }
            
            // Execute update
            return Database::update($this->collection, ['_id' => $objectId], $updateDoc);
        } catch (Exception $e) {
            return false;
        }
    }

    public function delete($id) {
        try {
            // Convert ID to ObjectId
            $objectId = new MongoDB\BSON\ObjectId($id);
            // Delete submission from database
            return Database::delete($this->collection, ['_id' => $objectId]);
        } catch (Exception $e) {
            return false;
        }
    }

    public function getFiltered($filters = [], $limit = 500, $offset = 0) {
        // Initialize filter variables
        $mongoFilter = [];
        $andClauses = [];

        // Add organization filter if provided
        if (!empty($filters['organizationId'])) {
            $andClauses[] = $this->buildOrgIdFilter($filters['organizationId']);
        }
        // Add status filter if provided
        if (!empty($filters['status'])) {
            $andClauses[] = ['status' => $filters['status']];
        }
        // Add search filter with regex across multiple fields
        if (!empty($filters['search'])) {
            $s = trim($filters['search']);
            $regex = new MongoDB\BSON\Regex(preg_quote($s), 'i');
            $andClauses[] = ['$or' => [
                ['orgInfo.name' => $regex], ['orgInfo.acronym' => $regex],
                ['event.eventName' => $regex], ['event.eventSDG' => $regex]
            ]];
        }
        // Add month/year filter if provided
        if (!empty($filters['month']) && !empty($filters['year'])) {
            $m = str_pad((int)$filters['month'], 2, '0', STR_PAD_LEFT);
            $y = (int)$filters['year'];
            $andClauses[] = ['event.eventDate' => new MongoDB\BSON\Regex("^{$y}-{$m}", 'i')];
        }
        // Add date filter if provided
        if (!empty($filters['date'])) {
            $d = $filters['date'];
            // Try multiple date formats
            $dateOr = [['event.eventDate' => $d], ['event.eventDate' => new MongoDB\BSON\Regex("^" . preg_quote($d), 'i')]];
            try {
                // Also try UTC datetime range
                $startUTC = new MongoDB\BSON\UTCDateTime(strtotime($d . ' 00:00:00') * 1000);
                $endUTC = new MongoDB\BSON\UTCDateTime(strtotime($d . ' 23:59:59') * 1000);
                $dateOr[] = ['event.eventDate' => ['$gte' => $startUTC, '$lte' => $endUTC]];
            } catch (Exception $e) {}
            $andClauses[] = ['$or' => $dateOr];
        }

        // Combine all filters into single query
        $mongoFilter = (count($andClauses) === 1) ? $andClauses[0] : (empty($andClauses) ? [] : ['$and' => $andClauses]);

        // Define query options with sorting
        $options = ['skip' => $offset, 'limit' => $limit, 'sort' => ['submittedAt' => -1]];
        // Query with filters
        $cursor = Database::query($this->collection, $mongoFilter, $options);
        // Return formatted results
        return $this->cursorToArray($cursor);
    }

    private function buildOrgIdFilter($orgId) {
        // Initialize ObjectId variable
        $objectId = null;
        // Try to convert string to ObjectId if valid format
        if (is_string($orgId) && preg_match('/^[a-f0-9]{24}$/i', $orgId)) {
            try {
                $objectId = new MongoDB\BSON\ObjectId($orgId);
            } catch (Exception $e) {}
        }
        // Return filter matching either ObjectId or string
        return ['$or' => [['orgInfo.orgId' => $objectId ?? $orgId], ['orgInfo.orgId' => $orgId]]];
    }

    private function cursorToArray($cursor) {
        // Initialize results array
        $results = [];
        // Format each document from cursor
        foreach ($cursor as $document) {
            $results[] = $this->formatDocument($document);
        }
        // Return formatted results
        return $results;
    }

    private function formatDocument($document) {
        // Convert BSON document to JSON then to array
        $doc = json_decode(json_encode($document), true);
        // Extract ObjectId value from BSON format
        if (isset($doc['_id']['$oid'])) {
            $doc['_id'] = $doc['_id']['$oid'];
        }
        // Return formatted document
        return $doc;
    }
}
?>

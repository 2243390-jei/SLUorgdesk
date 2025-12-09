<?php
require_once __DIR__ . '/../database/dbAccess.php';

/**
 * Submission Model
 */
class Submission
{
    private $collection = 'Submissions';

    /**
     * Get all submissions with complete data
     */
    public function getAll($limit = 50, $offset = 0)
    {
        $options = [
            'skip' => $offset,
            'limit' => $limit,
            'sort' => ['submittedAt' => -1]
        ];

        $cursor = Database::query($this->collection, [], $options);
        return $this->cursorToArray($cursor);
    }

    /**
     * Get submission by ID
     */
    public function getById($id)
    {
        try {
            $objectId = new MongoDB\BSON\ObjectId($id);
            $cursor = Database::query($this->collection, ['_id' => $objectId]);
            $result = $cursor->toArray();
            return !empty($result) ? $this->formatDocument($result[0]) : null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Get submissions by organization
     */
    public function getByOrganization($orgId, $limit = 50, $offset = 0)
    {
        try {
            // Convert orgId to MongoDB ObjectId if it's a valid 24-char hex string
            $objectId = null;
            if (is_string($orgId) && preg_match('/^[a-f0-9]{24}$/i', $orgId)) {
                try {
                    $objectId = new MongoDB\BSON\ObjectId($orgId);
                } catch (Exception $e) {
                    // If conversion fails, use string as-is
                }
            }

            // Query can match either the ObjectId or the string representation
            $filter = [
                '$or' => [
                    ['orgInfo.orgId' => $objectId ?? $orgId],
                    ['orgInfo.orgId' => $orgId]  // fallback to string match
                ]
            ];

            $options = [
                'skip' => $offset,
                'limit' => $limit,
                'sort' => ['submittedAt' => -1]
            ];

            $cursor = Database::query($this->collection, $filter, $options);
            return $this->cursorToArray($cursor);
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Get submissions by academic year and semester
     */
    public function getByYearSemester($year, $semester, $limit = 50, $offset = 0)
    {
        $options = [
            'skip' => $offset,
            'limit' => $limit,
            'sort' => ['submittedAt' => -1]
        ];

        $filter = ['academicYear' => $year, 'semester' => $semester];
        $cursor = Database::query($this->collection, $filter, $options);
        return $this->cursorToArray($cursor);
    }

    /**
     * Create submission
     */
    public function create($data)
    {
        $document = [
            'applicationInfo' => $data['applicationInfo'] ?? [],
            'orgInfo' => $data['orgInfo'] ?? [],
            'academicYear' => $data['academicYear'] ?? null,
            'semester' => $data['semester'] ?? null,
            'event' => $data['event'] ?? [],
            'documentUploads' => $data['documentUploads'] ?? [],
            'status' => $data['status'] ?? 'pending',
            'submittedAt' => new MongoDB\BSON\UTCDateTime(time() * 1000)
        ];

        return Database::insert($this->collection, $document);
    }

    /**
     * Update submission
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
     * Delete submission
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
     * Get submissions by flexible filters:
     * $filters = [
     *   'organizationId' => string,
     *   'status' => string,
     *   'search' => string,
     *   'month' => int (1-12),
     *   'year' => int (YYYY),
     *   'date' => 'YYYY-MM-DD'
     * ]
     */
    public function getFiltered($filters = [], $limit = 500, $offset = 0)
    {
        $mongoFilter = [];
        $andClauses = [];
        $orClauses = [];

        // organizationId: try ObjectId conversion and fallback to string
        if (!empty($filters['organizationId'])) {
            $orgId = $filters['organizationId'];
            $objectId = null;
            if (is_string($orgId) && preg_match('/^[a-f0-9]{24}$/i', $orgId)) {
                try {
                    $objectId = new MongoDB\BSON\ObjectId($orgId);
                } catch (Exception $e) {
                    $objectId = null;
                }
            }

            $orClauses[] = ['orgInfo.orgId' => $objectId ?? $orgId];
            $orClauses[] = ['orgInfo.orgId' => $orgId];
        }

        // status exact match
        if (!empty($filters['status'])) {
            $andClauses[] = ['status' => $filters['status']];
        }

        // search across few text fields using case-insensitive regex
        if (!empty($filters['search'])) {
            $s = trim($filters['search']);
            $regex = new MongoDB\BSON\Regex(preg_quote($s), 'i');
            $searchOr = [
                ['orgInfo.name' => $regex],
                ['orgInfo.acronym' => $regex],
                ['event.eventName' => $regex],
                ['event.eventSDG' => $regex],
            ];
            $andClauses[] = ['$or' => $searchOr];
        }

        // month/year filtering on event.eventDate (expecting 'YYYY-MM-DD' or parseable date string)
        if (!empty($filters['month']) && !empty($filters['year'])) {
            $m = (int)$filters['month'];
            $y = (int)$filters['year'];
            $mm = str_pad($m, 2, '0', STR_PAD_LEFT);
            $dateRegex = new MongoDB\BSON\Regex("^{$y}-{$mm}", 'i');
            $andClauses[] = ['event.eventDate' => $dateRegex];
        }

        // exact day filtering: try string match, regex start, or UTCDateTime range
        if (!empty($filters['date'])) {
            $d = $filters['date']; // expect YYYY-MM-DD
            $dateOr = [];

            // direct string match
            $dateOr[] = ['event.eventDate' => $d];

            // regex start match (in case stored with time)
            $dateOr[] = ['event.eventDate' => new MongoDB\BSON\Regex("^" . preg_quote($d), 'i')];

            // also support UTCDateTime stored dates - construct start/end range
            try {
                $startTs = strtotime($d . ' 00:00:00');
                $endTs = strtotime($d . ' 23:59:59');
                if ($startTs !== false && $endTs !== false) {
                    $startUTC = new MongoDB\BSON\UTCDateTime($startTs * 1000);
                    $endUTC = new MongoDB\BSON\UTCDateTime($endTs * 1000);
                    $dateOr[] = ['event.eventDate' => ['$gte' => $startUTC, '$lte' => $endUTC]];
                }
            } catch (Exception $e) {
                // ignore UTCDateTime construction errors
            }

            $andClauses[] = ['$or' => $dateOr];
        }

        // Merge or-clauses into filter if present
        if (!empty($orClauses)) {
            $andClauses[] = ['$or' => $orClauses];
        }

        // Build final mongoFilter
        if (!empty($andClauses)) {
            if (count($andClauses) === 1) {
                $mongoFilter = $andClauses[0];
            } else {
                $mongoFilter = ['$and' => $andClauses];
            }
        } else {
            $mongoFilter = []; // match all
        }

        // options
        $options = [
            'skip' => $offset,
            'limit' => $limit,
            'sort' => ['submittedAt' => -1]
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

<?php
require_once __DIR__ . '/../models/Submission.php';

/**
 * Submission Controller
 */
class SubmissionController
{
    private $submission;

    public function __construct()
    {
        $this->submission = new Submission();
    }

    /**
     * Get all submissions
     */
    public function getAll()
    {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $data = $this->submission->getAll($limit, $offset);
        return ['success' => true, 'data' => $data];
    }

    /**
     * Get submission by ID
     */
    public function getById($id)
    {
        $data = $this->submission->getById($id);
        if (!$data) {
            return ['success' => false, 'error' => 'Submission not found'];
        }
        return ['success' => true, 'data' => $data];
    }

    /**
     * Get submission by event ID
     */
    public function getByEventId($eventId)
    {
        $data = $this->submission->getByEventId($eventId);
        if (!$data) {
            return ['success' => false, 'error' => 'Submission not found'];
        }
        return ['success' => true, 'data' => $data];
    }

    /**
     * Get submissions by organization
     */
    public function getByOrganization($orgId)
    {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $data = $this->submission->getByOrganization($orgId, $limit, $offset);
        return ['success' => true, 'data' => $data];
    }

    /**
     * Get submissions by year and semester
     */
    public function getByYearSemester($year, $semester)
    {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $data = $this->submission->getByYearSemester($year, $semester, $limit, $offset);
        return ['success' => true, 'data' => $data];
    }

    /**
     * Create submission
     */
    public function create($data)
{
    // List of required fields
    $requiredFields = ['applicationInfo', 'event'];
    $missingFields = [];

    // Check which fields are missing or empty
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            $missingFields[] = $field;
        }
    }

    // If any required fields are missing, return them
    if (!empty($missingFields)) {
        return [
            'success' => false,
            'error' => 'Missing required fields: ' . implode(', ', $missingFields)
        ];
    }

    // All required fields are present, proceed with creation
    $id = $this->submission->create($data);
    return ['success' => true, 'id' => (string)$id];
}


    /**
     * Update submission
     */
    public function update($id, $data)
    {
        $result = $this->submission->update($id, $data);
        if (!$result) {
            return ['success' => false, 'error' => 'Update failed'];
        }
        return ['success' => true];
    }

    /**
     * Delete submission
     */
    public function delete($id)
    {
        $result = $this->submission->delete($id);
        if (!$result) {
            return ['success' => false, 'error' => 'Delete failed'];
        }
        return ['success' => true];
    }

    /**
     * Get submissions by flexible filtering (search, status, month/year, organizationId, myorg, date)
     * Accepts an array of query params ($_GET)
     */
    public function getFiltered($queryParams = [])
    {
        $limit = isset($queryParams['limit']) ? (int)$queryParams['limit'] : 500; // larger default for calendar
        $offset = isset($queryParams['offset']) ? (int)$queryParams['offset'] : 0;

        $filters = [];
        if (!empty($queryParams['organizationId'])) {
            $filters['organizationId'] = $queryParams['organizationId'];
        }

        if (!empty($queryParams['status'])) {
            $filters['status'] = $queryParams['status'];
        }

        if (!empty($queryParams['search'])) {
            $filters['search'] = $queryParams['search'];
        }

        if (!empty($queryParams['month']) && !empty($queryParams['year'])) {
            $filters['month'] = (int)$queryParams['month'];
            $filters['year'] = (int)$queryParams['year'];
        }

        // exact day filter (YYYY-MM-DD)
        if (!empty($queryParams['date'])) {
            $filters['date'] = $queryParams['date'];
        }

        // myorg: when '1', use session organizationId if available
        if (!empty($queryParams['myorg']) && $queryParams['myorg'] === '1') {
            if (!empty($_SESSION['user']['organizationId'])) {
                $filters['organizationId'] = $_SESSION['user']['organizationId'];
            }
        }

        $data = $this->submission->getFiltered($filters, $limit, $offset);
        return ['success' => true, 'data' => $data];
    }
}
?>

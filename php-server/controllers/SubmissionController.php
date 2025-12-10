<?php
require_once __DIR__ . '/../models/Submission.php';

class SubmissionController {
    private $submission;

    public function __construct() {
        $this->submission = new Submission();
    }

    public function getAll() {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        return ['success' => true, 'data' => $this->submission->getAll($limit, $offset)];
    }

    public function getById($id) {
        $data = $this->submission->getById($id);
        return $data ? ['success' => true, 'data' => $data] : ['success' => false, 'error' => 'Submission not found'];
    }

    public function getByOrganization($orgId) {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        return ['success' => true, 'data' => $this->submission->getByOrganization($orgId, $limit, $offset)];
    }

    public function create($data) {
        $required = ['applicationInfo', 'orgInfo', 'academicYear', 'semester', 'events'];
        $missing = [];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $missing[] = $field;
            }
        }
        
        if (!empty($missing)) {
            return ['success' => false, 'error' => 'Missing: ' . implode(', ', $missing)];
        }

        if (!is_array($data['events']) || empty($data['events'])) {
            return ['success' => false, 'error' => 'At least one event is required'];
        }

        $id = $this->submission->create($data);
        return ['success' => true, 'id' => (string)$id];
    }

    public function update($id, $data) {
        $result = $this->submission->update($id, $data);
        return $result ? ['success' => true] : ['success' => false, 'error' => 'Update failed'];
    }

    public function delete($id) {
        $result = $this->submission->delete($id);
        return $result ? ['success' => true] : ['success' => false, 'error' => 'Delete failed'];
    }

    public function getFiltered($queryParams = []) {
        $limit = isset($queryParams['limit']) ? (int)$queryParams['limit'] : 500;
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
        if (!empty($queryParams['date'])) {
            $filters['date'] = $queryParams['date'];
        }
        if (!empty($queryParams['myorg']) && $queryParams['myorg'] === '1' && !empty($_SESSION['user']['organizationId'])) {
            $filters['organizationId'] = $_SESSION['user']['organizationId'];
        }

        return ['success' => true, 'data' => $this->submission->getFiltered($filters, $limit, $offset)];
    }
}
?>

<?php
require_once __DIR__ . '/../models/Organization.php';

class OrganizationController {
    private $org;

    public function __construct() {
        $this->org = new Organization();
    }

    public function getAll() {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        return ['success' => true, 'data' => $this->org->getAll($limit, $offset)];
    }

    public function getById($id) {
        $data = $this->org->getById($id);
        return $data ? ['success' => true, 'data' => $data] : ['success' => false, 'error' => 'Organization not found'];
    }

    public function create($data) {
        if (empty($data['name']) || empty($data['acronym'])) {
            return ['success' => false, 'error' => 'Name and acronym are required'];
        }
        $id = $this->org->create($data);
        return ['success' => true, 'id' => (string)$id];
    }

    public function update($id, $data) {
        $result = $this->org->update($id, $data);
        return $result ? ['success' => true] : ['success' => false, 'error' => 'Update failed'];
    }

    public function delete($id) {
        $result = $this->org->delete($id);
        return $result ? ['success' => true] : ['success' => false, 'error' => 'Delete failed'];
    }

    public function getFiltered($queryParams = []) {
        $limit = isset($queryParams['limit']) ? (int)$queryParams['limit'] : 100;
        $offset = isset($queryParams['offset']) ? (int)$queryParams['offset'] : 0;
        
        $filters = array_filter([
            'id' => $queryParams['id'] ?? null,
            'search' => $queryParams['search'] ?? null,
            'school' => $queryParams['school'] ?? null,
            'acronym' => $queryParams['acronym'] ?? null
        ]);

        return ['success' => true, 'data' => $this->org->getFiltered($filters, $limit, $offset)];
    }
}
?>

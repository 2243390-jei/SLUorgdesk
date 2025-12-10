<?php
require_once __DIR__ . '/../models/Organization.php';

class OrganizationController {
    private $org;

    public function __construct() {
        // Initialize organization model
        $this->org = new Organization();
    }

    public function getAll() {
        // Get pagination params with defaults
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        // Fetch all organizations
        return ['success' => true, 'data' => $this->org->getAll($limit, $offset)];
    }

    public function getById($id) {
        // Fetch organization by ID
        $data = $this->org->getById($id);
        return $data ? ['success' => true, 'data' => $data] : ['success' => false, 'error' => 'Organization not found'];
    }

    public function getFiltered($queryParams = []) {
        // Get pagination params with defaults
        $limit = isset($queryParams['limit']) ? (int)$queryParams['limit'] : 100;
        $offset = isset($queryParams['offset']) ? (int)$queryParams['offset'] : 0;
        
        // Build filters from query params
        $filters = array_filter([
            'id' => $queryParams['id'] ?? null,
            'search' => $queryParams['search'] ?? null,
            'school' => $queryParams['school'] ?? null,
            'acronym' => $queryParams['acronym'] ?? null
        ]);

        // Fetch filtered organizations
        return ['success' => true, 'data' => $this->org->getFiltered($filters, $limit, $offset)];
    }
}
?>

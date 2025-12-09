<?php
require_once __DIR__ . '/../models/Organization.php';

/**
 * Organization Controller
 */
class OrganizationController
{
    private $org;

    public function __construct()
    {
        $this->org = new Organization();
    }

    /**
     * Get all organizations
     */
    public function getAll()
    {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $data = $this->org->getAll($limit, $offset);
        return ['success' => true, 'data' => $data];
    }

    /**
     * Get organization by ID
     */
    public function getById($id)
    {
        $data = $this->org->getById($id);
        if (!$data) {
            return ['success' => false, 'error' => 'Organization not found'];
        }
        return ['success' => true, 'data' => $data];
    }

    /**
     * Create organization
     */
    public function create($data)
    {
        if (empty($data['name']) || empty($data['acronym'])) {
            return ['success' => false, 'error' => 'Missing required fields'];
        }

        $id = $this->org->create($data);
        return ['success' => true, 'id' => (string)$id];
    }

    /**
     * Update organization
     */
    public function update($id, $data)
    {
        $result = $this->org->update($id, $data);
        if (!$result) {
            return ['success' => false, 'error' => 'Update failed'];
        }
        return ['success' => true];
    }

    /**
     * Delete organization
     */
    public function delete($id)
    {
        $result = $this->org->delete($id);
        if (!$result) {
            return ['success' => false, 'error' => 'Delete failed'];
        }
        return ['success' => true];
    }

    /**
     * Get organizations by flexible filtering (search, school, acronym, id)
     * Accepts an array of query params ($_GET)
     */
    public function getFiltered($queryParams = [])
    {
        $limit = isset($queryParams['limit']) ? (int)$queryParams['limit'] : 100;
        $offset = isset($queryParams['offset']) ? (int)$queryParams['offset'] : 0;

        $filters = [];
        if (!empty($queryParams['id'])) {
            $filters['id'] = $queryParams['id'];
        }
        if (!empty($queryParams['search'])) {
            $filters['search'] = $queryParams['search'];
        }
        if (!empty($queryParams['school'])) {
            $filters['school'] = $queryParams['school'];
        }
        if (!empty($queryParams['acronym'])) {
            $filters['acronym'] = $queryParams['acronym'];
        }

        $data = $this->org->getFiltered($filters, $limit, $offset);
        return ['success' => true, 'data' => $data];
    }
}
?>

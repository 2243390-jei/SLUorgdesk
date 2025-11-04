<?php
// --- Prevent unwanted output ---
error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

try {
    // MongoDB connection string
    $uri = "mongodb+srv://root:root123360@software-engineering.vw1nyls.mongodb.net/Web-Tech?retryWrites=true&w=majority&appName=Software-Engineering";

    // Create MongoDB Manager instance
    $manager = new MongoDB\Driver\Manager($uri);

    // Query all users
    $query = new MongoDB\Driver\Query([]);
    $cursor = $manager->executeQuery("Web-Tech.User", $query);

    $users = [];

    foreach ($cursor as $document) {
        $doc = (array)$document;

        // Normalize ObjectId
        $id = isset($doc['_id']) && $doc['_id'] instanceof MongoDB\BSON\ObjectId
            ? (string)$doc['_id']
            : (string)($doc['_id'] ?? '');

        // Handle organizations (array of ObjectIds)
        $orgs = [];
        if (isset($doc['organizations']) && is_array($doc['organizations'])) {
            foreach ($doc['organizations'] as $org) {
                if ($org instanceof MongoDB\BSON\ObjectId) {
                    $orgs[] = (string)$org;
                } elseif (is_object($org) && property_exists($org, '$oid')) {
                    $orgs[] = (string)$org->{'$oid'};
                } else {
                    $orgs[] = (string)$org;
                }
            }
        }

        // Handle date fields
        $createdAt = isset($doc['createdAt']) && $doc['createdAt'] instanceof MongoDB\BSON\UTCDateTime
            ? $doc['createdAt']->toDateTime()->format('Y-m-d H:i:s')
            : null;
        $updatedAt = isset($doc['updatedAt']) && $doc['updatedAt'] instanceof MongoDB\BSON\UTCDateTime
            ? $doc['updatedAt']->toDateTime()->format('Y-m-d H:i:s')
            : null;

        // --- ✅ Add password field properly ---
        $password = $doc['password'] ?? "";

        // Build clean user array
        $users[] = [
            "_id" => $id,
            "name" => $doc['name'] ?? "",
            "email" => $doc['email'] ?? "",
            "password" => $password, // <-- include this
            "role" => $doc['role'] ?? "",
            "studentId" => $doc['studentId'] ?? "",
            "employeeId" => $doc['employeeId'] ?? "",
            "school" => $doc['school'] ?? "",
            "department" => $doc['department'] ?? "",
            "course" => $doc['course'] ?? "",
            "yearLevel" => isset($doc['yearLevel']) ? (int)$doc['yearLevel'] : null,
            "isActive" => $doc['isActive'] ?? false,
            "organizations" => $orgs,
            "handledOrganizations" => isset($doc['handledOrganizations'])
                ? array_map(fn($o) => (string)$o->{'$oid'}, (array)$doc['handledOrganizations'])
                : [],
            "createdAt" => $createdAt,
            "updatedAt" => $updatedAt
        ];
    }

    ob_clean();
    http_response_code(200);
    echo json_encode($users, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "message" => $e->getMessage()
    ]);
} finally {
    ob_end_flush();
}
?>

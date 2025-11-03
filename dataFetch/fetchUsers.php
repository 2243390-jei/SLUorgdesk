<?php
// Prevent any unwanted output
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Ensure clean output
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

    // Query all users (you can add filters inside the [])
    $query = new MongoDB\Driver\Query([]);

    // Execute query on the "Users" collection
    $cursor = $manager->executeQuery("Web-Tech.User", $query);

    // Convert cursor to array of users
    $users = [];
    foreach ($cursor as $document) {
        $doc = (array)$document;

        // Handle nested / MongoDB-specific objects
        $users[] = [
            "_id" => (string)$doc['_id'],
            "name" => $doc['name'] ?? "",
            "email" => $doc['email'] ?? "",
            "role" => $doc['role'] ?? "",
            "studentId" => $doc['studentId'] ?? "",
            "school" => $doc['school'] ?? "",
            "course" => $doc['course'] ?? "",
            "yearLevel" => isset($doc['yearLevel']) ? (int)$doc['yearLevel'] : null,
            "isActive" => $doc['isActive'] ?? false,
            "organizations" => isset($doc['organizations']) ? array_map(fn($org) => (string)$org->{'$oid'}, $doc['organizations']) : [],
            "createdAt" => isset($doc['createdAt']) ? date('Y-m-d H:i:s', $doc['createdAt']->toDateTime()->getTimestamp()) : null,
            "updatedAt" => isset($doc['updatedAt']) ? date('Y-m-d H:i:s', $doc['updatedAt']->toDateTime()->getTimestamp()) : null
        ];
    }

    // Clean any output buffers before sending JSON
    ob_clean();
    
    // Return JSON with proper headers
    http_response_code(200);
    echo json_encode($users, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    // Clean any output buffers before sending error
    ob_clean();
    
    // Return error with proper status code
    http_response_code(500);
    echo json_encode([
        "error" => true,
        "message" => $e->getMessage()
    ]);
} finally {
    // Ensure all buffered content is sent
    ob_end_flush();
}
?>

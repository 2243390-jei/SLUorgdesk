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
        // Convert BSON document to PHP array-ish/object
        $doc = (array)$document;

        // Normalize _id
        $id = '';
        if (isset($doc['_id'])) {
            if ($doc['_id'] instanceof MongoDB\BSON\ObjectId) {
                $id = (string)$doc['_id'];
            } elseif (is_object($doc['_id']) && property_exists($doc['_id'], '$oid')) {
                $id = (string)$doc['_id']->{'$oid'};
            } else {
                $id = (string)$doc['_id'];
            }
        }

        // --- Normalize single "organization" (could be ObjectId or { $oid: ... } or string) ---
        $singleOrg = null;
        if (isset($doc['organization'])) {
            $orgRaw = $doc['organization'];
            if ($orgRaw instanceof MongoDB\BSON\ObjectId) {
                $singleOrg = (string)$orgRaw;
            } elseif (is_object($orgRaw) && property_exists($orgRaw, '$oid')) {
                $singleOrg = (string)$orgRaw->{'$oid'};
            } else {
                $singleOrg = (string)$orgRaw;
            }
        }

        // --- Normalize "organizations" (array / BSONArray) into array of strings ---
        $orgs = [];
        if (isset($doc['organizations'])) {
            // cast to array to handle BSONArray
            $orgArray = (array)$doc['organizations'];
            foreach ($orgArray as $orgItem) {
                if ($orgItem instanceof MongoDB\BSON\ObjectId) {
                    $orgs[] = (string)$orgItem;
                } elseif (is_object($orgItem) && property_exists($orgItem, '$oid')) {
                    $orgs[] = (string)$orgItem->{'$oid'};
                } else {
                    $orgs[] = (string)$orgItem;
                }
            }
        } elseif ($singleOrg !== null) {
            // if only single organization present, make it the first element of organizations
            $orgs[] = $singleOrg;
        }

        // --- Normalize handledOrganizations (array / BSONArray) ---
        $handled = [];
        if (isset($doc['handledOrganizations'])) {
            $handledArray = (array)$doc['handledOrganizations'];
            foreach ($handledArray as $ho) {
                if ($ho instanceof MongoDB\BSON\ObjectId) {
                    $handled[] = (string)$ho;
                } elseif (is_object($ho) && property_exists($ho, '$oid')) {
                    $handled[] = (string)$ho->{'$oid'};
                } else {
                    $handled[] = (string)$ho;
                }
            }
        }

        // --- Dates ---
        $createdAt = null;
        if (isset($doc['createdAt']) && $doc['createdAt'] instanceof MongoDB\BSON\UTCDateTime) {
            $createdAt = $doc['createdAt']->toDateTime()->format('Y-m-d H:i:s');
        } elseif (isset($doc['createdAt']) && is_numeric($doc['createdAt'])) {
            // fallback if stored as timestamp number
            $createdAt = date('Y-m-d H:i:s', (int)$doc['createdAt']);
        }

        $updatedAt = null;
        if (isset($doc['updatedAt']) && $doc['updatedAt'] instanceof MongoDB\BSON\UTCDateTime) {
            $updatedAt = $doc['updatedAt']->toDateTime()->format('Y-m-d H:i:s');
        } elseif (isset($doc['updatedAt']) && is_numeric($doc['updatedAt'])) {
            $updatedAt = date('Y-m-d H:i:s', (int)$doc['updatedAt']);
        }

        // password (may be hashed)
        $password = $doc['password'] ?? "";

        // construct user object with consistent fields
        $users[] = [
            "_id" => $id,
            "name" => $doc['name'] ?? "",
            "email" => $doc['email'] ?? "",
            "password" => $password,
            "role" => $doc['role'] ?? "",
            "studentId" => $doc['studentId'] ?? "",
            "employeeId" => $doc['employeeId'] ?? "",
            "school" => $doc['school'] ?? "",
            "department" => $doc['department'] ?? "",
            "course" => $doc['course'] ?? "",
            "yearLevel" => isset($doc['yearLevel']) ? (int)$doc['yearLevel'] : null,
            "isActive" => $doc['isActive'] ?? false,
            // include both a single-organization string (or null) and an array of organizations
            "organization" => $singleOrg,             // string or null
            "organizations" => $orgs,                 // always an array
            "handledOrganizations" => $handled,
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

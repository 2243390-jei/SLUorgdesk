<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Always return JSON and allow cross-origin requests if needed by the front-end
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Convert PHP errors to exceptions so they can be returned as JSON
set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// Catch fatal errors on shutdown and return JSON instead of HTML
register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        // Clean any buffered output
        if (ob_get_length()) ob_end_clean();
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Fatal error', 'details' => $err]);
    }
});

// Helper: normalize MongoDB extended JSON recursively
function normalize_mongo_extended($val) {
    if (is_array($val)) {
        if (count($val) === 1) {
            if (isset($val['$oid'])) return (string)$val['$oid'];
            if (isset($val['$numberInt'])) return intval($val['$numberInt']);
            if (isset($val['$numberLong'])) return intval($val['$numberLong']);
            if (isset($val['$date'])) {
                if (is_array($val['$date']) && isset($val['$date']['$numberLong'])) {
                    $ms = intval($val['$date']['$numberLong']);
                    return date('c', $ms / 1000);
                }
                return $val['$date'];
            }
        }

        $out = [];
        foreach ($val as $k => $v) {
            $out[$k] = normalize_mongo_extended($v);
        }
        return $out;
    }
    return $val;
}

try {
    // MongoDB Atlas connection
    $uri = "mongodb+srv://root:root123360@software-engineering.vw1nyls.mongodb.net/Web-Tech?retryWrites=true&w=majority&appName=Software-Engineering";

    if (!class_exists('MongoDB\\Driver\\Manager')) {
        throw new Exception("MongoDB PHP driver not installed or not enabled.");
    }

    $manager = new MongoDB\Driver\Manager($uri);

    // ✅ NEW FEATURE: Fetch single submission by event_id
    if (isset($_GET['event_id']) && !empty($_GET['event_id'])) {
        $eventId = $_GET['event_id'];
        $filter = ['event.id' => $eventId]; // matches how you store event.id in MongoDB
        $query = new MongoDB\Driver\Query($filter);
        $cursor = $manager->executeQuery("Web-Tech.Submissions", $query);

        $result = current($cursor->toArray());

        if ($result) {
            $doc = json_decode(json_encode($result), true);
            $doc = normalize_mongo_extended($doc);

            $submission = [
                "_id" => isset($doc['_id']) ? (string)$doc['_id'] : '',
                "academicYear" => $doc['academicYear'] ?? '',
                "semester" => $doc['semester'] ?? '',
                "applicationInfo" => [
                    "applicantName" => $doc['applicationInfo']['applicantName'] ?? '',
                    "email" => $doc['applicationInfo']['email'] ?? '',
                    "position" => $doc['applicationInfo']['position'] ?? ''
                ],
                "orgInfo" => [
                    "orgId" => $doc['orgInfo']['orgId'] ?? '',
                    "name" => $doc['orgInfo']['name'] ?? '',
                    "acronym" => $doc['orgInfo']['acronym'] ?? '',
                    "email" => $doc['orgInfo']['email'] ?? ''
                ],
                "event" => [
                    "id" => $doc['event']['id'] ?? '',
                    "eventName" => $doc['event']['eventName'] ?? '',
                    "eventType" => $doc['event']['eventType'] ?? '',
                    "eventDate" => $doc['event']['eventDate'] ?? '',
                    "startTime" => $doc['event']['startTime'] ?? '',
                    "endTime" => $doc['event']['endTime'] ?? '',
                    "eventVenue" => $doc['event']['eventVenue'] ?? '',
                    "eventDescription" => $doc['event']['eventDescription'] ?? '',
                    "attendance" => isset($doc['event']['attendance']) ? intval($doc['event']['attendance']) : null,
                    "eventProof" => $doc['event']['eventProof'] ?? '',
                    "eventSDG" => $doc['event']['eventSDG'] ?? [],
                    "supportingDocuments" => $doc['event']['supportingDocuments'] ?? []
                ]
            ];

            http_response_code(200);
            echo json_encode($submission, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            exit;
        } else {
            http_response_code(404);
            echo json_encode(["error" => "No submission found for event_id: $eventId"]);
            exit;
        }
    }

    // ✅ Existing filter logic (keep as is)
    $filter = [];
    if (isset($_GET['orgId']) && !empty($_GET['orgId'])) {
        try {
            $orgId = new MongoDB\BSON\ObjectId($_GET['orgId']);
            $filter = ['orgInfo.orgId' => $orgId];
        } catch (Exception $e) {
            // fallback in case of invalid ObjectId format
            $filter = ['orgInfo.orgId' => $_GET['orgId']];
        }
    }

    // Fetch all submissions (or filtered if orgId is provided)
    $query = new MongoDB\Driver\Query($filter);
    $cursor = $manager->executeQuery("Web-Tech.Submissions", $query);

    $submissions = [];

    foreach ($cursor as $document) {
        $doc = json_decode(json_encode($document), true);
        $doc = normalize_mongo_extended($doc);

        $submissions[] = [
            "_id" => isset($doc['_id']) ? (string)$doc['_id'] : '',
            "academicYear" => $doc['academicYear'] ?? '',
            "semester" => $doc['semester'] ?? '',
            "applicationInfo" => [
                "applicantName" => $doc['applicationInfo']['applicantName'] ?? '',
                "email" => $doc['applicationInfo']['email'] ?? '',
                "position" => $doc['applicationInfo']['position'] ?? ''
            ],
            "orgInfo" => [
                "orgId" => $doc['orgInfo']['orgId'] ?? '',
                "name" => $doc['orgInfo']['name'] ?? '',
                "acronym" => $doc['orgInfo']['acronym'] ?? '',
                "email" => $doc['orgInfo']['email'] ?? ''
            ],
            "event" => [
                "id" => $doc['event']['id'] ?? '',
                "eventName" => $doc['event']['eventName'] ?? '',
                "eventType" => $doc['event']['eventType'] ?? '',
                "eventDate" => $doc['event']['eventDate'] ?? '',
                "startTime" => $doc['event']['startTime'] ?? '',
                "endTime" => $doc['event']['endTime'] ?? '',
                "eventVenue" => $doc['event']['eventVenue'] ?? '',
                "eventDescription" => $doc['event']['eventDescription'] ?? '',
                "attendance" => isset($doc['event']['attendance']) ? intval($doc['event']['attendance']) : null,
                "eventProof" => $doc['event']['eventProof'] ?? '',
                "eventSDG" => $doc['event']['eventSDG'] ?? [],
                "supportingDocuments" => $doc['event']['supportingDocuments'] ?? []
            ]
        ];
    }

    http_response_code(200);
    echo json_encode($submissions, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>

<?php
header('Content-Type: application/json; charset=utf-8');

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

    // Fetch all submissions
    $query = new MongoDB\Driver\Query([]);
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

    echo json_encode($submissions, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>

<?php
header('Content-Type: application/json');

try {
    // Use your correct connection string
    $uri = "mongodb+srv://root:root123360@software-engineering.vw1nyls.mongodb.net/Web-Tech?retryWrites=true&w=majority&appName=Software-Engineering";
    
    // Connect directly using the MongoDB driver (no Composer needed)
    $manager = new MongoDB\Driver\Manager($uri);

    // Query all documents in the Organizations collection
    $query = new MongoDB\Driver\Query([]);
    $cursor = $manager->executeQuery("Web-Tech.Organizations", $query);

    // Convert documents to array
    $orgs = [];
    foreach ($cursor as $document) {
        $doc = (array)$document;
        
        // Get the localLogoPath if it exists, otherwise create a default path based on acronym
        $localLogoPath = $doc['localLogoPath'] ?? '';
        
        // If localLogoPath doesn't exist in database, create a default one
        if (empty($localLogoPath) && isset($doc['acronym'])) {
            $acronym = $doc['acronym'];
            // Create default path based on acronym
            $localLogoPath = "../Images/orgs/" . $acronym . ".jpg";
        }
        
        $orgs[] = [
            "_id" => (string)$doc['_id'],
            "name" => $doc['name'] ?? "",
            "acronym" => $doc['acronym'] ?? "",
            "school" => $doc['school'] ?? "",
            "logoUrl" => $doc['logoUrl'] ?? "",
            "localLogoPath" => $localLogoPath,  // ADDED THIS LINE
            "email" => $doc['email'] ?? "",
            "isWhitelisted" => $doc['isWhitelisted'] ?? false
        ];
    }

    echo json_encode($orgs, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
<?php
// Check if MongoDB PHP driver is installed
if (!class_exists("MongoDB\\Driver\\Manager")) {
    die("MongoDB PHP driver not installed.");
}

class Database {
    private static string $URI = "mongodb+srv://root:root123360@software-engineering.vw1nyls.mongodb.net/Web-Tech?retryWrites=true&w=majority&appName=Software-Engineering";
    private static string $DB = "Web-Tech";
    private static ?\MongoDB\Driver\Manager $manager = null;

    public static function connect(): void {
        // Initialize MongoDB connection if not already connected
        if (self::$manager === null) {
            self::$manager = new \MongoDB\Driver\Manager(self::$URI);
        }
    }

    private static function ns(string $collection): string {
        // Build namespace string for collection (database.collection)
        return self::$DB . "." . $collection;
    }

    public static function query(string $collection, array $filter = [], array $options = []): \MongoDB\Driver\Cursor {
        // Ensure connected to database
        self::connect();
        // Create MongoDB query with filter and options
        $query = new \MongoDB\Driver\Query($filter, $options);
        // Execute query and return cursor
        return self::$manager->executeQuery(self::ns($collection), $query);
    }

    public static function insert(string $collection, array $document) {
        // Ensure connected to database
        self::connect();
        // Create bulk write operation
        $bulk = new \MongoDB\Driver\BulkWrite();
        // Insert document and get ID
        $id = $bulk->insert($document);
        // Execute insert operation
        self::$manager->executeBulkWrite(self::ns($collection), $bulk);
        // Return inserted ID as string
        return (string)$id;
    }

    public static function update(string $collection, array $filter, array $update, bool $multi = false): bool {
        // Ensure connected to database
        self::connect();
        // Check if update is operator (starts with $)
        $isOp = array_key_first($update)[0] === "$";
        // Wrap update in $set if not using operators
        $updateDoc = $isOp ? $update : ['$set' => $update];

        // Create bulk write operation
        $bulk = new \MongoDB\Driver\BulkWrite();
        // Add update to bulk write
        $bulk->update($filter, $updateDoc, ["multi" => $multi]);
        // Execute update and get result
        $res = self::$manager->executeBulkWrite(self::ns($collection), $bulk);
        // Return true if documents were modified
        return $res->getModifiedCount() > 0;
    }

    public static function delete(string $collection, array $filter, int $limit = 1): bool {
        // Ensure connected to database
        self::connect();
        // Create bulk write operation
        $bulk = new \MongoDB\Driver\BulkWrite();
        // Add delete to bulk write
        $bulk->delete($filter, ["limit" => $limit]);
        // Execute delete and get result
        $res = self::$manager->executeBulkWrite(self::ns($collection), $bulk);
        // Return true if documents were deleted
        return $res->getDeletedCount() > 0;
    }

    public static function objectId(string $id): \MongoDB\BSON\ObjectId {
        // Convert string to MongoDB ObjectId
        return new \MongoDB\BSON\ObjectId($id);
    }
}

// Initialize database connection on load
Database::connect();
?>
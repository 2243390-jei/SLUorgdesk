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
        self::connect();
        $bulk = new \MongoDB\Driver\BulkWrite();
        $id = $bulk->insert($document);
        self::$manager->executeBulkWrite(self::ns($collection), $bulk);
        return (string)$id;
    }

    public static function update(string $collection, array $filter, array $update, bool $multi = false): bool {
        // Ensure connected to database
        self::connect();
        $isOp = array_key_first($update)[0] === "$";
        $updateDoc = $isOp ? $update : ['$set' => $update];

        $bulk = new \MongoDB\Driver\BulkWrite();
        $bulk->update($filter, $updateDoc, ["multi" => $multi]);
        $res = self::$manager->executeBulkWrite(self::ns($collection), $bulk);
        return $res->getModifiedCount() > 0;
    }

    public static function delete(string $collection, array $filter, int $limit = 1): bool {
        self::connect();
        $bulk = new \MongoDB\Driver\BulkWrite();
        $bulk->delete($filter, ["limit" => $limit]);
        $res = self::$manager->executeBulkWrite(self::ns($collection), $bulk);
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
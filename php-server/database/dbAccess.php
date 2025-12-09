<?php
// database/dbAccess.php
if (!class_exists("MongoDB\\Driver\\Manager")) {
    die("MongoDB PHP driver not installed.");
}

class Database
{
    private static string $URI = "mongodb+srv://root:root123360@software-engineering.vw1nyls.mongodb.net/Web-Tech?retryWrites=true&w=majority&appName=Software-Engineering";
    private static string $DB  = "Web-Tech";

    private static ?\MongoDB\Driver\Manager $manager = null;

    // Automatically connect when the file is loaded
    public static function connect(): void
    {
        if (self::$manager === null) {
            self::$manager = new \MongoDB\Driver\Manager(self::$URI);
        }
    }

    private static function ns(string $collection): string
    {
        return self::$DB . "." . $collection;
    }

    // Query a collection
    public static function query(string $collection, array $filter = [], array $options = []): \MongoDB\Driver\Cursor
    {
        self::connect();
        $query = new \MongoDB\Driver\Query($filter, $options);
        return self::$manager->executeQuery(self::ns($collection), $query);
    }

    // Insert document
    public static function insert(string $collection, array $document)
    {
        self::connect();
        $bulk = new \MongoDB\Driver\BulkWrite();
        $id = $bulk->insert($document);

        self::$manager->executeBulkWrite(self::ns($collection), $bulk);
        return (string)$id;
    }

    // Update document(s)
    public static function update(string $collection, array $filter, array $update, bool $multi = false): bool
    {
        self::connect();

        // Auto-wrap with $set if no MongoDB operator
        $isOp = array_key_first($update)[0] === "$";
        $updateDoc = $isOp ? $update : ['$set' => $update];

        $bulk = new \MongoDB\Driver\BulkWrite();
        $bulk->update($filter, $updateDoc, ["multi" => $multi]);

        $res = self::$manager->executeBulkWrite(self::ns($collection), $bulk);
        return $res->getModifiedCount() > 0;
    }

    // Delete document(s)
    public static function delete(string $collection, array $filter, int $limit = 1): bool
    {
        self::connect();
        $bulk = new \MongoDB\Driver\BulkWrite();
        $bulk->delete($filter, ["limit" => $limit]);

        $res = self::$manager->executeBulkWrite(self::ns($collection), $bulk);
        return $res->getDeletedCount() > 0;
    }

    // Create ObjectId
    public static function objectId(string $id): \MongoDB\BSON\ObjectId
    {
        return new \MongoDB\BSON\ObjectId($id);
    }
}

// Auto-connect
Database::connect();

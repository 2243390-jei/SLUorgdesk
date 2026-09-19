<?php
// Check if MongoDB PHP driver is installed
if (!class_exists("MongoDB\\Driver\\Manager")) {
    die("MongoDB PHP driver not installed.");
}

class Database {
    // Credentials are read from the environment so that neither the image nor
    // the repository carries secrets. On Cloud Run they are injected from
    // Secret Manager; locally they come from the project-root .env file.
    private static ?string $URI = null;
    private static ?string $DB = null;
    private static ?\MongoDB\Driver\Manager $manager = null;
    private static bool $envLoaded = false;
    private static ?string $lastError = null;

    /**
     * Parse the project-root .env file once, without overwriting variables that
     * the process environment already provides. Sharing one configuration file
     * keeps PHP and Node in sync.
     */
    private static function loadEnvFile(): void {
        if (self::$envLoaded) return;
        self::$envLoaded = true;

        $envFile = dirname(__DIR__, 2) . '/.env';
        if (!is_readable($envFile)) return;

        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            // Skip comments and malformed lines
            if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) continue;

            $parts = explode('=', $line, 2);
            $key = trim($parts[0]);
            $value = trim($parts[1], " \t\n\r\0\x0B\"'");

            // Real environment variables take precedence
            if ($key === '' || getenv($key) !== false) continue;

            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
        }
    }

    private static function env(string $key, ?string $default = null): ?string {
        self::loadEnvFile();
        $value = getenv($key);
        $value = ($value === false) ? '' : trim($value, " \t\n\r\0\x0B\"'");
        return $value === '' ? $default : $value;
    }

    /**
     * Create the driver manager, tolerating misconfiguration.
     *
     * A `mongodb+srv://` URI performs its DNS SRV lookup while the Manager is
     * being constructed, so a bad host or missing credentials fails here rather
     * than at query time. That failure is recorded and logged instead of thrown:
     * otherwise every page - including the login form - would die with an
     * uncaught fatal and render nothing.
     */
    public static function connect(): void {
        // Initialize MongoDB connection if not already connected
        if (self::$manager !== null || self::$lastError !== null) return;

        self::$URI ??= self::env('MONGO_URI');
        self::$DB  ??= self::env('MONGO_DB', 'Web-Tech');

        if (empty(self::$URI)) {
            self::$lastError = 'MONGO_URI is not configured. Set it in the environment '
                . '(Cloud Run: Secret Manager) or in the project-root .env file.';
            error_log('[orgdesk] ' . self::$lastError);
            return;
        }

        try {
            self::$manager = new \MongoDB\Driver\Manager(self::$URI);
        } catch (\Throwable $e) {
            self::$lastError = 'MongoDB connection could not be initialised: ' . $e->getMessage();
            error_log('[orgdesk] ' . self::$lastError);
        }
    }

    /**
     * The active driver manager, or a clear, catchable error when the database
     * is unavailable. Callers (controllers and route scripts) already wrap their
     * database work in try/catch, so this surfaces as a JSON error response.
     */
    private static function manager(): \MongoDB\Driver\Manager {
        self::connect();
        if (self::$manager === null) {
            throw new RuntimeException(self::$lastError ?? 'MongoDB is not available.');
        }
        return self::$manager;
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
        return self::manager()->executeQuery(self::ns($collection), $query);
    }

    public static function insert(string $collection, array $document) {
        self::connect();
        $bulk = new \MongoDB\Driver\BulkWrite();
        $id = $bulk->insert($document);
        self::manager()->executeBulkWrite(self::ns($collection), $bulk);
        return (string)$id;
    }

    public static function update(string $collection, array $filter, array $update, bool $multi = false): bool {
        // Ensure connected to database
        self::connect();
        $isOp = array_key_first($update)[0] === "$";
        $updateDoc = $isOp ? $update : ['$set' => $update];

        $bulk = new \MongoDB\Driver\BulkWrite();
        $bulk->update($filter, $updateDoc, ["multi" => $multi]);
        $res = self::manager()->executeBulkWrite(self::ns($collection), $bulk);
        return $res->getModifiedCount() > 0;
    }

    public static function delete(string $collection, array $filter, int $limit = 1): bool {
        self::connect();
        $bulk = new \MongoDB\Driver\BulkWrite();
        $bulk->delete($filter, ["limit" => $limit]);
        $res = self::manager()->executeBulkWrite(self::ns($collection), $bulk);
        return $res->getDeletedCount() > 0;
    }

    public static function objectId(string $id): \MongoDB\BSON\ObjectId {
        // Convert string to MongoDB ObjectId
        return new \MongoDB\BSON\ObjectId($id);
    }
}

// Warm up the connection on load. connect() never throws: a misconfiguration is
// logged once and surfaced only by the queries that actually need the database.
Database::connect();
?>
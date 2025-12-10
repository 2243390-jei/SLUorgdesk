<?php
class FileUploadService
{
    private $baseUploadDir = __DIR__ . '/../../uploads';
    private $allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'zip', 'xls', 'xlsx'];
    private $maxFileSize = 50 * 1024 * 1024; // 50 MB

    /**
     * Constructor
     * Ensures base upload directory exists
     */
    public function __construct()
    {
        if (!is_dir($this->baseUploadDir)) {
            mkdir($this->baseUploadDir, 0755, true);
        }
    }

    /**
     * Upload files for an organization
     * @param array $files - $_FILES array or similar structure
     * @param string $orgAcronym - Organization acronym for folder structure
     * @param string $submissionId - MongoDB submission ID for subfolder
     * @return array - Array of uploaded file paths or errors
     */
    public function uploadFiles($files, $orgAcronym, $submissionId = null)
    {
        $results = [
            'success' => [],
            'errors' => [],
            'paths' => []
        ];

        if (!is_array($files) || empty($files)) {
            return $results;
        }

        // Create organization folder if doesn't exist
        $orgFolder = $this->createOrgFolder($orgAcronym);
        if (!$orgFolder) {
            $results['errors'][] = 'Failed to create organization folder';
            return $results;
        }

        // Create submission subfolder if ID provided
        $uploadDir = $orgFolder;
        if ($submissionId) {
            $submissionFolder = $orgFolder . '/' . $submissionId;
            if (!is_dir($submissionFolder)) {
                if (!mkdir($submissionFolder, 0755, true)) {
                    $results['errors'][] = 'Failed to create submission folder';
                    return $results;
                }
            }
            $uploadDir = $submissionFolder;
        }

        // Handle both single and multiple file uploads
        $filesArray = $this->normalizeFilesArray($files);

        foreach ($filesArray as $file) {
            $uploadResult = $this->uploadSingleFile($file, $uploadDir, $orgAcronym, $submissionId);
            
            if ($uploadResult['success']) {
                $results['success'][] = $uploadResult['filename'];
                $results['paths'][] = $uploadResult['path'];
            } else {
                $results['errors'][] = $uploadResult['error'];
            }
        }

        return $results;
    }

    /**
     * Create organization folder
     * @param string $orgAcronym - Organization acronym
     * @return string|false - Folder path or false on failure
     */
    private function createOrgFolder($orgAcronym)
    {
        // Sanitize acronym to prevent directory traversal
        $orgAcronym = preg_replace('/[^a-zA-Z0-9_-]/', '', $orgAcronym);
        if (empty($orgAcronym)) {
            $orgAcronym = 'unknown';
        }

        $orgFolder = $this->baseUploadDir . '/' . strtolower($orgAcronym);
        
        if (!is_dir($orgFolder)) {
            if (!mkdir($orgFolder, 0755, true)) {
                return false;
            }
        }

        return $orgFolder;
    }

    /**
     * Normalize $_FILES array to standard format
     * @param array $files - $_FILES array
     * @return array - Normalized array of file info
     */
    private function normalizeFilesArray($files)
    {        $normalized = [];

        foreach ($files as $fieldName => $fileData) {
            if (is_array($fileData['name'])) {
                // Multiple files in same field
                $count = count($fileData['name']);
                for ($i = 0; $i < $count; $i++) {
                    $normalized[] = [
                        'name' => $fileData['name'][$i],
                        'type' => $fileData['type'][$i],
                        'tmp_name' => $fileData['tmp_name'][$i],
                        'error' => $fileData['error'][$i],
                        'size' => $fileData['size'][$i]
                    ];
                }
            } else {
                // Single file
                $normalized[] = $fileData;
            }
        }

        return $normalized;
    }

    /**
     * Upload a single file
     * @param array $file - File info from $_FILES
     * @param string $uploadDir - Directory to upload to
     * @param string $orgAcronym - Organization acronym
     * @param string $submissionId - Submission ID (optional)
     * @return array - Upload result with success status and file path
     */
    private function uploadSingleFile($file, $uploadDir, $orgAcronym, $submissionId = null)
    {
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return [
                'success' => false,
                'error' => $this->getUploadErrorMessage($file['error'])
            ];
        }

        // Validate file
        $validation = $this->validateFile($file);
        if (!$validation['valid']) {
            return [
                'success' => false,
                'error' => $validation['error']
            ];
        }

        // Generate unique filename
        $filename = $this->generateUniqueFilename($file['name']);
        $filepath = $uploadDir . '/' . $filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return [
                'success' => false,
                'error' => 'Failed to save file: ' . $file['name']
            ];
        }

        // Generate relative path for database storage
        $relativePath = '/uploads/' . strtolower($orgAcronym) . '/' . basename($filename);
        if ($submissionId) {
            $relativePath = '/uploads/' . strtolower($orgAcronym) . '/' . $submissionId . '/' . basename($filename);
        }

        return [
            'success' => true,
            'filename' => $filename,
            'path' => $relativePath
        ];
    }

    /**
     * Validate file
     * @param array $file - File info
     * @return array - Validation result
     */
    private function validateFile($file)
    {
        // Check file size
        if ($file['size'] > $this->maxFileSize) {
            return [
                'valid' => false,
                'error' => 'File too large: ' . $file['name'] . ' (max 50MB)'
            ];
        }

        // Check file extension
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $this->allowedExtensions)) {
            return [
                'valid' => false,
                'error' => 'File type not allowed: ' . $ext
            ];
        }

        return ['valid' => true];
    }

    /**
     * Generate unique filename
     * @param string $originalName - Original filename
     * @return string - Unique filename
     */
    private function generateUniqueFilename($originalName)
    {
        $ext = pathinfo($originalName, PATHINFO_EXTENSION);
        $name = pathinfo($originalName, PATHINFO_FILENAME);
        
        // Sanitize filename
        $name = preg_replace('/[^a-zA-Z0-9_-]/', '_', $name);
        
        // Add timestamp and random string for uniqueness
        $unique = time() . '_' . bin2hex(random_bytes(4));
        
        return $name . '_' . $unique . '.' . $ext;
    }

    /**
     * Get upload error message
     * @param int $errorCode - PHP upload error code
     * @return string - Error message
     */
    private function getUploadErrorMessage($errorCode)
    {
        $messages = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds server limit',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds form limit',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
        ];

        return $messages[$errorCode] ?? 'Unknown upload error';
    }

    /**
     * Delete files associated with a submission
     * @param string $orgAcronym - Organization acronym
     * @param string $submissionId - Submission ID
     * @return bool - Success status
     */
    public function deleteSubmissionFiles($orgAcronym, $submissionId)
    {
        $orgAcronym = preg_replace('/[^a-zA-Z0-9_-]/', '', $orgAcronym);
        $submissionFolder = $this->baseUploadDir . '/' . strtolower($orgAcronym) . '/' . $submissionId;

        if (!is_dir($submissionFolder)) {
            return true; // Already deleted or never existed
        }

        return $this->deleteDirectory($submissionFolder);
    }

    /**
     * Recursively delete directory
     * @param string $dir - Directory path
     * @return bool - Success status
     */
    private function deleteDirectory($dir)
    {
        if (!is_dir($dir)) {
            return false;
        }

        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            if (is_dir($path)) {
                $this->deleteDirectory($path);
            } else {
                unlink($path);
            }
        }

        return rmdir($dir);
    }

    /**
     * Get list of files for a submission
     * @param string $orgAcronym - Organization acronym
     * @param string $submissionId - Submission ID
     * @return array - Array of file paths
     */
    public function getSubmissionFiles($orgAcronym, $submissionId)
    {
        $orgAcronym = preg_replace('/[^a-zA-Z0-9_-]/', '', $orgAcronym);
        $submissionFolder = $this->baseUploadDir . '/' . strtolower($orgAcronym) . '/' . $submissionId;

        if (!is_dir($submissionFolder)) {
            return [];
        }

        $files = array_diff(scandir($submissionFolder), ['.', '..']);
        $filePaths = [];

        foreach ($files as $file) {
            $filePaths[] = '/uploads/' . strtolower($orgAcronym) . '/' . $submissionId . '/' . $file;
        }

        return $filePaths;
    }
}
?>

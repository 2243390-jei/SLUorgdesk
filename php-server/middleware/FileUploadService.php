<?php

class FileUploadService
{
    private $baseUploadDir = __DIR__ . '/../../uploads';
    private $allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'zip', 'xls', 'xlsx'];
    private $maxFileSize = 50 * 1024 * 1024; // 50 MB

    public function __construct()
    {
        // Create base upload directory if it doesn't exist
        if (!is_dir($this->baseUploadDir)) {
            mkdir($this->baseUploadDir, 0755, true);
        }
    }

    public function uploadFiles($files, $orgAcronym, $submissionId = null)
    {
        // Initialize results array
        $results = [
            'success' => [],
            'errors'  => [],
            'paths'   => []
        ];

        // Return empty results if no files provided
        if (!is_array($files) || empty($files)) {
            return $results;
        }

        // Create organization folder
        $orgFolder = $this->createOrgFolder($orgAcronym);
        if (!$orgFolder) {
            $results['errors'][] = 'Failed to create organization folder';
            return $results;
        }

        // Set upload directory to organization folder
        $uploadDir = $orgFolder;
        // Create submission folder if submission ID provided
        if ($submissionId) {
            $submissionFolder = $orgFolder . '/' . $submissionId;
            if (!is_dir($submissionFolder) && !mkdir($submissionFolder, 0755, true)) {
                $results['errors'][] = 'Failed to create submission folder';
                return $results;
            }
            $uploadDir = $submissionFolder;
        }

        // Normalize files array format
        $filesArray = $this->normalizeFilesArray($files);
        // Upload each file
        foreach ($filesArray as $file) {
            // Upload single file and collect results
            $uploadResult = $this->uploadSingleFile($file, $uploadDir, $orgAcronym, $submissionId);

            if ($uploadResult['success']) {
                $results['success'][] = $uploadResult['filename'];
                $results['paths'][]   = $uploadResult['path'];
            } else {
                $results['errors'][]  = $uploadResult['error'];
            }
        }

        return $results;
    }

    private function createOrgFolder($orgAcronym)
    {
        $orgAcronym = preg_replace('/[^a-zA-Z0-9_-]/', '', $orgAcronym) ?: 'unknown';
        $orgFolder  = $this->baseUploadDir . '/' . strtolower($orgAcronym);

        if (!is_dir($orgFolder)) {
            mkdir($orgFolder, 0755, true);
        }

        // Return folder path or false if creation failed
        return is_dir($orgFolder) ? $orgFolder : false;
    }

    private function normalizeFilesArray($files)
    {
        // Initialize normalized array
        $normalized = [];

        // Process each file input
        foreach ($files as $fileData) {
            if (is_array($fileData['name'])) {
                foreach ($fileData['name'] as $i => $name) {
                    if ($fileData['error'][$i] === UPLOAD_ERR_NO_FILE) continue;

                    // Build normalized file data
                    $normalized[] = [
                        'name'     => $name,
                        'type'     => $fileData['type'][$i],
                        'tmp_name' => $fileData['tmp_name'][$i],
                        'error'    => $fileData['error'][$i],
                        'size'     => $fileData['size'][$i],
                    ];
                }
            } else {
                // Handle single file input
                if ($fileData['error'] !== UPLOAD_ERR_NO_FILE) {
                    $normalized[] = $fileData;
                }
            }
        }
        // Return normalized files array
        return $normalized;
    }

    private function uploadSingleFile($file, $uploadDir, $orgAcronym, $submissionId = null)
    {
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['success' => false, 'error' => $this->getUploadErrorMessage($file['error'])];
        }

        // Validate file type and size
        $validation = $this->validateFile($file);
        if (!$validation['valid']) {
            return ['success' => false, 'error' => $validation['error']];
        }

        // Generate unique filename to prevent duplicates
        $filename = $this->generateUniqueFilename($file['name'], $uploadDir);
        $filepath = $uploadDir . '/' . $filename;

        // Move uploaded file to destination
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return ['success' => false, 'error' => 'Failed to save file: ' . $file['name']];
        }

        // Build web-accessible relative path
        $relativePath = '/uploads/' . strtolower($orgAcronym);
        if ($submissionId) {
            $relativePath .= '/' . $submissionId;
        }
        $relativePath .= '/' . $filename;

        return [
            'success'  => true,
            'filename' => $filename,
            'path'     => $relativePath
        ];
    }


    private function generateUniqueFilename($originalName, $uploadDir)
    {
        // Extract file extension and name
        $ext  = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $name = pathinfo($originalName, PATHINFO_FILENAME);
        $name = preg_replace('/[^a-zA-Z0-9_-]/', '_', $name);
        $name = preg_replace('/_+/', '_', $name);
        $name = trim($name, '_');
        $name = $name ?: 'file';

        // Limit filename length
        if (strlen($name) > 100) {
            $name = substr($name, 0, 100);
        }

        // Create date-time prefix for unique filenames
        $datePrefix = date('Y-m-d_H-i-s');

        // Initialize counter for duplicate prevention
        $counter  = 0;
        $filename = "{$datePrefix}_{$name}.{$ext}";

        while (file_exists($uploadDir . '/' . $filename)) {
            $counter++;
            $filename = "{$datePrefix}_{$name}_{$counter}.{$ext}";
        }

        // Return unique filename
        return $filename;
    }

    private function validateFile($file)
    {
        // Check if file size exceeds limit
        if ($file['size'] > $this->maxFileSize) {
            return ['valid' => false, 'error' => 'File too large (max 50MB)'];
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $this->allowedExtensions)) {
            return ['valid' => false, 'error' => "File type not allowed: {$ext}"];
        }

        return ['valid' => true];
    }

    private function getUploadErrorMessage($code)
    {
        // Map error codes to human-readable messages
        $messages = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds server limit',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds form limit',
            UPLOAD_ERR_PARTIAL   => 'File only partially uploaded',
            UPLOAD_ERR_NO_FILE   => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR=> 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE=> 'Failed to write file',
            UPLOAD_ERR_EXTENSION => 'Upload stopped by extension',
        ];

        // Return error message or generic message
        return $messages[$code] ?? 'Unknown upload error';
    }
}
?>
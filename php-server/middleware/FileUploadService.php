<?php

class FileUploadService
{
    private $baseUploadDir = __DIR__ . '/../../uploads';
    private $allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'zip', 'xls', 'xlsx'];
    private $maxFileSize = 50 * 1024 * 1024; // 50 MB

    public function __construct()
    {
        if (!is_dir($this->baseUploadDir)) {
            mkdir($this->baseUploadDir, 0755, true);
        }
    }

    /**
     * Main upload method
     */
    public function uploadFiles($files, $orgAcronym, $submissionId = null)
    {
        $results = [
            'success' => [],
            'errors'  => [],
            'paths'   => []
        ];

        if (!is_array($files) || empty($files)) {
            return $results;
        }

        $orgFolder = $this->createOrgFolder($orgAcronym);
        if (!$orgFolder) {
            $results['errors'][] = 'Failed to create organization folder';
            return $results;
        }

        $uploadDir = $orgFolder;
        if ($submissionId) {
            $submissionFolder = $orgFolder . '/' . $submissionId;
            if (!is_dir($submissionFolder) && !mkdir($submissionFolder, 0755, true)) {
                $results['errors'][] = 'Failed to create submission folder';
                return $results;
            }
            $uploadDir = $submissionFolder;
        }

        $filesArray = $this->normalizeFilesArray($files);
        foreach ($filesArray as $file) {
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

        return is_dir($orgFolder) ? $orgFolder : false;
    }

    private function normalizeFilesArray($files)
    {
        $normalized = [];

        foreach ($files as $fileData) {
            if (is_array($fileData['name'])) {
                // Multiple files
                foreach ($fileData['name'] as $i => $name) {
                    if ($fileData['error'][$i] === UPLOAD_ERR_NO_FILE) continue;

                    $normalized[] = [
                        'name'     => $name,
                        'type'     => $fileData['type'][$i],
                        'tmp_name' => $fileData['tmp_name'][$i],
                        'error'    => $fileData['error'][$i],
                        'size'     => $fileData['size'][$i],
                    ];
                }
            } else {
                // Single file
                if ($fileData['error'] !== UPLOAD_ERR_NO_FILE) {
                    $normalized[] = $fileData;
                }
            }
        }
        return $normalized;
    }

    private function uploadSingleFile($file, $uploadDir, $orgAcronym, $submissionId = null)
    {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['success' => false, 'error' => $this->getUploadErrorMessage($file['error'])];
        }

        $validation = $this->validateFile($file);
        if (!$validation['valid']) {
            return ['success' => false, 'error' => $validation['error']];
        }

        $filename = $this->generateUniqueFilename($file['name'], $uploadDir);
        $filepath = $uploadDir . '/' . $filename;

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

    /**
     * Option 1 – Clean date-time + original name (with collision protection)
     */
    private function generateUniqueFilename($originalName, $uploadDir)
    {
        $ext  = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $name = pathinfo($originalName, PATHINFO_FILENAME);

        // Sanitize name
        $name = preg_replace('/[^a-zA-Z0-9_-]/', '_', $name);
        $name = preg_replace('/_+/', '_', $name);   // collapse multiple _
        $name = trim($name, '_');
        $name = $name ?: 'file';

        // Limit length
        if (strlen($name) > 100) {
            $name = substr($name, 0, 100);
        }

        $datePrefix = date('Y-m-d_H-i-s'); // 2025-12-11_14-30-25

        $counter  = 0;
        $filename = "{$datePrefix}_{$name}.{$ext}";

        while (file_exists($uploadDir . '/' . $filename)) {
            $counter++;
            $filename = "{$datePrefix}_{$name}_{$counter}.{$ext}";
        }

        return $filename;
    }

    private function validateFile($file)
    {
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
        $messages = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds server limit',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds form limit',
            UPLOAD_ERR_PARTIAL   => 'File only partially uploaded',
            UPLOAD_ERR_NO_FILE   => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR=> 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE=> 'Failed to write file',
            UPLOAD_ERR_EXTENSION => 'Upload stopped by extension',
        ];

        return $messages[$code] ?? 'Unknown upload error';
    }

    // ──────────────────────────────────────────────────────────────
    // Delete & List methods (unchanged, just cleaned up a bit)
    // ──────────────────────────────────────────────────────────────

    public function deleteSubmissionFiles($orgAcronym, $submissionId)
    {
        $orgAcronym = preg_replace('/[^a-zA-Z0-9_-]/', '', $orgAcronym);
        $folder = $this->baseUploadDir . '/' . strtolower($orgAcronym) . '/' . $submissionId;

        if (!is_dir($folder)) return true;

        return $this->deleteDirectory($folder);
    }

    private function deleteDirectory($dir)
    {
        if (!is_dir($dir)) return false;

        foreach (array_diff(scandir($dir), ['.', '..']) as $item) {
            $path = $dir . '/' . $item;
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        return rmdir($dir);
    }

    public function getSubmissionFiles($orgAcronym, $submissionId)
    {
        $orgAcronym = preg_replace('/[^a-zA-Z0-9_-]/', '', $orgAcronym);
        $folder = $this->baseUploadDir . '/' . strtolower($orgAcronym) . '/' . $submissionId;

        if (!is_dir($folder)) return [];

        $files = array_diff(scandir($folder), ['.', '..']);
        $paths = [];

        foreach ($files as $file) {
            $paths[] = '/uploads/' . strtolower($orgAcronym) . '/' . $submissionId . '/' . $file;
        }

        return $paths;
    }
}
?>
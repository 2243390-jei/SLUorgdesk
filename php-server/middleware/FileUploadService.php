<?php
class FileUploadService {
    private $baseUploadDir = __DIR__ . '/../../uploads';
    private $allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'zip', 'xls', 'xlsx'];
    private $maxFileSize = 50 * 1024 * 1024;

    public function __construct() {
        if (!is_dir($this->baseUploadDir)) {
            mkdir($this->baseUploadDir, 0755, true);
        }
    }

    public function uploadFiles($files, $orgAcronym, $submissionId = null) {
        $results = ['success' => [], 'errors' => [], 'paths' => []];

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
                $results['paths'][] = $uploadResult['path'];
            } else {
                $results['errors'][] = $uploadResult['error'];
            }
        }

        return $results;
    }

    private function createOrgFolder($orgAcronym) {
        $orgAcronym = preg_replace('/[^a-zA-Z0-9_-]/', '', $orgAcronym) ?: 'unknown';
        $orgFolder = $this->baseUploadDir . '/' . strtolower($orgAcronym);
        
        if (!is_dir($orgFolder) && !mkdir($orgFolder, 0755, true)) {
            return false;
        }
        return $orgFolder;
    }

    private function normalizeFilesArray($files) {
        $normalized = [];
        foreach ($files as $fieldName => $fileData) {
            if (is_array($fileData['name'])) {
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
                $normalized[] = $fileData;
            }
        }
        return $normalized;
    }

    private function uploadSingleFile($file, $uploadDir, $orgAcronym, $submissionId = null) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['success' => false, 'error' => $this->getUploadErrorMessage($file['error'])];
        }

        $validation = $this->validateFile($file);
        if (!$validation['valid']) {
            return ['success' => false, 'error' => $validation['error']];
        }

        $filename = $this->generateUniqueFilename($file['name']);
        $filepath = $uploadDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return ['success' => false, 'error' => 'Failed to save file: ' . $file['name']];
        }

        $relativePath = '/uploads/' . strtolower($orgAcronym) . '/' . basename($filename);
        if ($submissionId) {
            $relativePath = '/uploads/' . strtolower($orgAcronym) . '/' . $submissionId . '/' . basename($filename);
        }

        return ['success' => true, 'filename' => $filename, 'path' => $relativePath];
    }

    private function validateFile($file) {
        if ($file['size'] > $this->maxFileSize) {
            return ['valid' => false, 'error' => 'File too large: ' . $file['name'] . ' (max 50MB)'];
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $this->allowedExtensions)) {
            return ['valid' => false, 'error' => 'File type not allowed: ' . $ext];
        }

        return ['valid' => true];
    }

    private function generateUniqueFilename($originalName) {
        $ext = pathinfo($originalName, PATHINFO_EXTENSION);
        $name = pathinfo($originalName, PATHINFO_FILENAME);
        $name = preg_replace('/[^a-zA-Z0-9_-]/', '_', $name);
        $unique = time() . '_' . bin2hex(random_bytes(4));
        return $name . '_' . $unique . '.' . $ext;
    }

    private function getUploadErrorMessage($errorCode) {
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

    public function deleteSubmissionFiles($orgAcronym, $submissionId) {
        $orgAcronym = preg_replace('/[^a-zA-Z0-9_-]/', '', $orgAcronym);
        $submissionFolder = $this->baseUploadDir . '/' . strtolower($orgAcronym) . '/' . $submissionId;
        return !is_dir($submissionFolder) || $this->deleteDirectory($submissionFolder);
    }

    private function deleteDirectory($dir) {
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

    public function getSubmissionFiles($orgAcronym, $submissionId) {
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

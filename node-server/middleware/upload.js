const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// destination folder: <project>/public/images/orgs
const destDir = path.join(__dirname, '..', '..', 'public', 'images', 'orgs');
fs.mkdirSync(destDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, destDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    cb(null, `${name}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit


router.post('/upload_logo', upload.single('orgLogo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

//Path
  const relativePath = `../images/orgs/${req.file.filename}`;

  res.json({
    success: true,
    filePath: relativePath,
    filename: req.file.filename
  });
});

module.exports = router;
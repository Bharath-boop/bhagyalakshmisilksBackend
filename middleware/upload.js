// middleware/upload.js
// Handles image file uploads using Multer
// Supports single AND multiple file uploads

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Make sure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage: where to save + what to name the file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  // Unique name: timestamp + sanitized original name
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  },
});

// Only allow image file types
function fileFilter(req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
});

module.exports = upload;

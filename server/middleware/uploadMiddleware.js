const multer = require('multer');
const { storage } = require('../config/cloudinary'); // שימוש ב-storage מ־Cloudinary

// אין צורך בתיקיית uploads מקומית
const upload = multer({ storage });

module.exports = upload;

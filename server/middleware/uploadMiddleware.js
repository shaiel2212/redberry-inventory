const multer = require('multer');
const { storage, orderFormStorage } = require('../config/cloudinary');

// העלאה כללית
const upload = multer({ storage });

// העלאה ייעודית לטופסי הזמנה
const uploadOrderForm = multer({ storage: orderFormStorage });

module.exports = {
  upload,
  uploadOrderForm
};

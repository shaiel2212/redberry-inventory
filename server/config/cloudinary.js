const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'inventory-app', // תיקייה כללית לאפליקציה
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'gif'],
    transformation: [{ width: 1000, crop: 'limit' }],
  },
});

// קונפיגורציה מיוחדת לתמונות הזמנה מקורי
const orderFormStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'inventory-app/order-forms', // תיקייה ייעודית לטופסי הזמנה
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 1200, crop: 'limit' }], // רזולוציה גבוהה יותר לטופסים
  },
});

module.exports = {
  cloudinary,
  storage,
  orderFormStorage,
};

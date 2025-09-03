const express = require('express');
const router = express.Router();
const invoiceShippingController = require('../controllers/invoiceShippingController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// כל הנתיבים דורשים אימות
router.use(authenticateToken);

// הפעלת תהליך הפקת מסמכים למכירה
router.post('/process-sale/:saleId', 
  requireRole(['admin', 'seller']), 
  invoiceShippingController.processSaleComplete
);

// קבלת רשימת חשבוניות
router.get('/invoices', 
  requireRole(['admin', 'seller']), 
  invoiceShippingController.getInvoices
);

// קבלת רשימת תעודות משלוח
router.get('/shipping-notes', 
  requireRole(['admin', 'seller']), 
  invoiceShippingController.getShippingNotes
);

// קבלת רשימת תהליכים שנכשלו
router.get('/failed-processes', 
  requireRole(['admin']), 
  invoiceShippingController.getFailedProcesses
);

// ניסיון חוזר לתהליך שנכשל
router.post('/retry/:saleId', 
  requireRole(['admin']), 
  invoiceShippingController.retryFailedProcess
);

// הורדת קובץ PDF לפי נתיב
router.get('/download', 
  requireRole(['admin', 'seller']), 
  invoiceShippingController.downloadPDF
);

// בדיקת בריאות המערכת
router.get('/health', 
  requireRole(['admin']), 
  invoiceShippingController.healthCheck
);

// קבלת סטטיסטיקות
router.get('/statistics', 
  requireRole(['admin']), 
  invoiceShippingController.getStatistics
);

// עדכון הגדרות מערכת
router.put('/settings', 
  requireRole(['admin']), 
  invoiceShippingController.updateSystemSettings
);

module.exports = router; 
const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { uploadOrderForm } = require('../middleware/uploadMiddleware');
const {
    requireAuth,
    requireAdmin,
    requireSellerOrHigher,
} = require('../middleware/authMiddleware');

router.get('/report', requireAuth, requireAdmin, salesController.getSalesReport);
// server/routes/salesRoutes.js
router.post('/', requireAuth,requireSellerOrHigher, salesController.createSale);
router.post('/:id/order-form', requireAuth, requireSellerOrHigher, uploadOrderForm.single('orderForm'), salesController.uploadOrderForm);
router.get('/', requireAuth, requireAdmin, salesController.getAllSales);
router.get('/mine', requireAuth, requireSellerOrHigher, salesController.getSalesForCurrentSeller);
router.get('/recent',requireAuth ,salesController.getRecentSales);  

router.get('/:id', requireAuth, salesController.getSaleById);
router.patch('/:id/discount', requireAuth, requireAdmin, salesController.updateSaleDiscount);
router.patch('/:id/details', requireAuth, requireAdmin, salesController.updateSaleDetails);
router.patch('/:id/full-edit', requireAuth, requireAdmin, salesController.fullEditSale);
router.get('/:id/history', requireAuth, requireAdmin, salesController.getSaleEditHistory);

// מחיקת מכירה
router.delete('/:id', requireAuth, requireAdmin, salesController.deleteSale);

module.exports = router;

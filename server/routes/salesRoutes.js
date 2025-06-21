const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const {
    requireAuth,
    requireAdmin,
    requireSellerOrHigher,
} = require('../middleware/authMiddleware');

router.get('/report', requireAuth, requireAdmin, salesController.getSalesReport);

router.post('/', requireAuth,requireSellerOrHigher, salesController.createSale);
router.get('/', requireAuth, requireAdmin, salesController.getAllSales);
router.get('/mine', requireAuth, requireSellerOrHigher, salesController.getSalesForCurrentSeller);
router.get('/:id', requireAuth, salesController.getSaleById);
router.patch('/:id/discount', requireAuth, requireAdmin, salesController.updateSaleDiscount);
router.patch('/:id/details', requireAuth, requireAdmin, salesController.updateSaleDetails);

module.exports = router;

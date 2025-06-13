const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/', requireAuth, salesController.createSale);
router.get('/', requireAuth, salesController.getAllSales);
router.get('/:id', requireAuth, salesController.getSaleById);
router.patch('/:id/deliver', verifyToken, salesController.markSaleAsDelivered);

module.exports = router;

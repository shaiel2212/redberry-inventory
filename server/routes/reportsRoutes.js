const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/sales_summary', requireAuth, reportsController.getSalesSummary);
router.get('/low_stock', requireAuth, reportsController.getLowStockProducts);
router.get('/sales_by_day', requireAuth, reportsController.getSalesByDay);

module.exports = router;

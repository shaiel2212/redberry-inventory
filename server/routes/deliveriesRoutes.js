const express = require('express');
const router = express.Router();
const deliveriesController = require('../controllers/deliveriesController');
const { requireAuth, requireUserOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // ✅ כאן השימוש נקי

router.get('/all', requireAuth, requireUserOrAdmin, deliveriesController.getAllDeliveries);

router.get('/pending', requireAuth, requireUserOrAdmin, deliveriesController.getPendingDeliveries);

router.patch('/:id/deliver', requireAuth, requireUserOrAdmin, deliveriesController.markAsDelivered);
router.patch('/:id/assign', requireAuth, deliveriesController.assignToCourier);

router.get('/statuses', requireAuth, deliveriesController.getDeliveryStatuses);
router.get('/awaiting-stock', requireAuth, requireUserOrAdmin, deliveriesController.getAwaitingStockDeliveries);
router.patch('/:id/proof', requireAuth, requireUserOrAdmin, upload.single('proof'), deliveriesController.updateDeliveryProof);
router.patch('/:id/status', requireAuth, requireUserOrAdmin, deliveriesController.updateDeliveryStatus);
router.get('/dashboard-by-status', requireAuth, requireUserOrAdmin, deliveriesController.getDashboardDeliveriesByStatus);

router.get('/:id', requireAuth, requireUserOrAdmin, deliveriesController.getDeliveryById);

module.exports = router;
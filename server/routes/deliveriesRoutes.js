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

router.patch('/:id/proof', requireAuth, requireUserOrAdmin, upload.single('proof'), deliveriesController.updateDeliveryProof);
router.patch('/:id/status', requireAuth, requireUserOrAdmin, deliveriesController.updateDeliveryStatus);

module.exports = router;
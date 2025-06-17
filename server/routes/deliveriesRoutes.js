const express = require('express');
const router = express.Router();
const deliveriesController = require('../controllers/deliveriesController');
const { requireAuth, requireUserOrAdmin  } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // ✅ כאן השימוש נקי


router.get('/pending', requireAuth, requireUserOrAdmin, deliveriesController.getPendingDeliveries);

router.patch('/:id/deliver', requireAuth, requireUserOrAdmin, deliveriesController.markAsDelivered);

router.patch('/:id/proof', requireAuth, requireUserOrAdmin, upload.single('proof'), deliveriesController.updateDeliveryProof);

module.exports = router;
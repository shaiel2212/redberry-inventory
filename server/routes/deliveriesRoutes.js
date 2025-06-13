const express = require('express');
const router = express.Router();
const deliveriesController = require('../controllers/deliveriesController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/pending', requireAuth, deliveriesController.getPendingDeliveries);
router.patch('/:id/deliver', requireAuth, deliveriesController.markAsDelivered);

module.exports = router;
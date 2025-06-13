const express = require('express');
const router = express.Router();
const deliveriesController = require('../controllers/deliveriesController');
const verifyToken = require('../middleware/verifyToken');

router.get('/pending', verifyToken, deliveriesController.getPendingDeliveries);
router.patch('/:id/deliver', verifyToken, deliveriesController.markAsDelivered);

module.exports = router;
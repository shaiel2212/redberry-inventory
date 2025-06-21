const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/login', authController.loginUser);
router.get('/user', requireAuth, authController.getLoggedInUser);

module.exports = router;

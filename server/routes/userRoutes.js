const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', requireAuth, userController.getAllUsers);
router.put('/:id/role', requireAuth, requireAdmin, userController.updateUserRole);
router.delete('/:id', requireAuth, requireAdmin, userController.deleteUser);

module.exports = router;

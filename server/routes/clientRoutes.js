const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', requireAuth, requireAdmin, clientController.createClient);
router.get('/', clientController.getAllClients);
router.get('/billing-reminders', clientController.getClientsForBillingReminder);
router.put('/:id', requireAuth, requireAdmin, clientController.updateClient);
module.exports = router;

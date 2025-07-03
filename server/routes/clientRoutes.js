const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

router.post('/', clientController.createClient);
router.get('/', clientController.getAllClients);
router.get('/billing-reminders', clientController.getClientsForBillingReminder);
module.exports = router;

const express = require('express');
const { addPayment, getPayments } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/paymentSave', addPayment);
router.get('/getAllPayment', authMiddleware.verify(), getPayments);


module.exports = router; 
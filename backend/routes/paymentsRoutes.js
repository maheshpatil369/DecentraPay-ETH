'use strict';
const express = require('express');
const router  = express.Router();
const rateLimit = require('express-rate-limit');

const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/paymentsController');
const { sendPaymentRules } = require('../validations/validationRules');

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many send requests, please slow down' },
});

router.use(auth);

// POST /api/payments/send
router.post('/send', sendLimiter, sendPaymentRules, ctrl.send);

module.exports = router;


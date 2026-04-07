'use strict';
const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');
const auth      = require('../middleware/authMiddleware');
const ctrl      = require('../controllers/paymentController');
const {
  payByUsernameRules,
  payByAddressRules,
  splitPaymentRules,
} = require('../validations/validationRules');

const payLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many payment requests, please slow down' },
});

router.use(auth);

router.post('/pay-by-username', payLimiter, payByUsernameRules, ctrl.payByUsername);
router.post('/pay-by-address',  payLimiter, payByAddressRules,  ctrl.payByAddress);
router.post('/split-payment',   payLimiter, splitPaymentRules,  ctrl.splitPayment);
router.get('/history',                                           ctrl.getHistory);
router.get('/stats',                                             ctrl.getStats);

module.exports = router;
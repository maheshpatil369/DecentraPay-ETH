'use strict';
const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');
const auth      = require('../middleware/authMiddleware');
const ctrl      = require('../controllers/securityController');
const { pinRules } = require('../validations/validationRules');

const pinLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 min
  max: 10,
  message: { success: false, message: 'Too many PIN attempts. Wait 5 minutes.' },
});

router.use(auth);

router.post('/verify-pin', pinLimiter, pinRules, ctrl.verifyPin);
router.post('/set-pin',               pinRules,  ctrl.setPin);

module.exports = router;

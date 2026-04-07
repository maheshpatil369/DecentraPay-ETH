'use strict';
const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');
const auth      = require('../middleware/authMiddleware');
const ctrl      = require('../controllers/authController');
const { registerRules, loginRules } = require('../validations/validationRules');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, try again in 15 minutes' },
});

router.post('/register', authLimiter, registerRules, ctrl.register);
router.post('/login',    authLimiter, loginRules,    ctrl.login);
router.get('/me',        auth,                       ctrl.getMe);

module.exports = router;

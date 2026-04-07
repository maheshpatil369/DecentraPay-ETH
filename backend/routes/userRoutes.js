'use strict';
const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');
const auth      = require('../middleware/authMiddleware');
const ctrl      = require('../controllers/userController');

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 min
  max: 40,
  message: { success: false, message: 'Too many search requests' },
});

router.use(auth);

// IMPORTANT: specific routes before param routes
router.get('/search',           searchLimiter, ctrl.searchUsers);
router.get('/address/:address',                ctrl.getUserByAddress);
router.get('/:username',                       ctrl.getUserByUsername);
router.put('/profile',                         ctrl.updateProfile);

module.exports = router;

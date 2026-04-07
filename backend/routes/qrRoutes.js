'use strict';
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const ctrl = require('../controllers/qrController');

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many QR requests' },
});

router.post('/validate', limiter, ctrl.validate);
router.post('/resolve-user', limiter, ctrl.resolveUser);

module.exports = router;


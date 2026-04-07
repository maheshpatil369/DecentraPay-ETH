'use strict';
const bcrypt   = require('bcryptjs');
const { validationResult } = require('express-validator');
const User     = require('../models/User');
const logger   = require('../utils/logger');

const SALT_ROUNDS = () => Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

// ── POST /api/security/verify-pin ───────────────────────────────────
exports.verifyPin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    const { pin } = req.body;
    const user = await User.findById(req.user.id).select('+pinHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.pinHash)
      return res.status(400).json({ success: false, message: 'No PIN set for this account' });

    const valid = await user.verifyPin(String(pin));
    if (!valid)
      return res.status(401).json({ success: false, message: 'Incorrect PIN' });

    return res.json({ success: true, message: 'PIN verified' });
  } catch (err) { next(err); }
};

// ── POST /api/security/set-pin ───────────────────────────────────────
exports.setPin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    const { pin } = req.body;
    const pinHash = await bcrypt.hash(String(pin), SALT_ROUNDS());
    await User.findByIdAndUpdate(req.user.id, { pinHash });

    logger.info(`PIN updated for user ${req.user.id}`);
    return res.json({ success: true, message: 'PIN updated successfully' });
  } catch (err) { next(err); }
};

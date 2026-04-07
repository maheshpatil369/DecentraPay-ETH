'use strict';
const User   = require('../models/User');
const logger = require('../utils/logger');

// ── GET /api/users/:username ─────────────────────────────────────────
exports.getUserByUsername = async (req, res, next) => {
  try {
    const username = req.params.username.toLowerCase().replace(/^@/, '').trim();
    const user = await User.findOne({ username, isActive: true });
    if (!user) return res.status(404).json({ success: false, message: `User @${username} not found` });
    return res.json({ success: true, user: user.toPublic() });
  } catch (err) { next(err); }
};

// ── GET /api/users/search?username=ma ────────────────────────────────
exports.searchUsers = async (req, res, next) => {
  try {
    const q = (req.query.username || '').toLowerCase().replace(/^@/, '').trim();
    if (!q || q.length < 2)
      return res.status(400).json({ success: false, message: 'Search query too short (min 2 chars)' });

    const users = await User.find(
      { username: { $regex: `^${q}`, $options: 'i' }, isActive: true },
      { username: 1, fullName: 1, profileImage: 1, avatarColor: 1, walletAddress: 1 }
    ).limit(10).lean();

    return res.json({ success: true, users });
  } catch (err) { next(err); }
};

// ── GET /api/users/address/:address ──────────────────────────────────
exports.getUserByAddress = async (req, res, next) => {
  try {
    const user = await User.findOne({ walletAddress: req.params.address, isActive: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found for this address' });
    return res.json({ success: true, user: user.toPublic() });
  } catch (err) { next(err); }
};

// ── PUT /api/users/profile ───────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['fullName', 'profileImage'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ success: false, message: 'No valid fields to update' });

    const user = await User.findByIdAndUpdate(
      req.user.id, updates, { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    logger.info(`Profile updated: @${user.username}`);
    return res.json({ success: true, user: user.toPublic() });
  } catch (err) { next(err); }
};

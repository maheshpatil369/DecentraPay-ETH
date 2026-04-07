'use strict';
const { ethers } = require('ethers');
const User = require('../models/User');

const isValidAmount = (val) => {
  const n = Number(val);
  return Number.isFinite(n) && n > 0;
};

// POST /api/qr/validate
exports.validate = async (req, res) => {
  const { qrData } = req.body || {};
  if (!qrData || typeof qrData !== 'string')
    return res.status(400).json({ success: false, message: 'qrData is required' });

  let parsed;
  try {
    parsed = JSON.parse(qrData);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid QR JSON' });
  }

  const toRaw = parsed?.to;
  if (!toRaw) return res.status(400).json({ success: false, message: 'QR missing "to"' });

  let to;
  try {
    to = ethers.getAddress(String(toRaw));
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid receiver address in QR' });
  }

  const amountRaw = parsed?.amount;
  const cleaned = { to };

  if (amountRaw !== undefined && amountRaw !== null && String(amountRaw).trim() !== '') {
    if (!isValidAmount(amountRaw))
      return res.status(400).json({ success: false, message: 'Invalid amount in QR' });
    cleaned.amount = String(amountRaw);
  }

  return res.json({ success: true, data: cleaned });
};

// POST /api/qr/resolve-user
exports.resolveUser = async (req, res) => {
  const usernameRaw = req.body?.username;
  if (!usernameRaw || typeof usernameRaw !== 'string')
    return res.status(400).json({ success: false, message: 'username is required' });

  const username = usernameRaw.toLowerCase().replace(/^@/, '').trim();
  if (!username)
    return res.status(400).json({ success: false, message: 'username is required' });

  const user = await User.findOne({ username, isActive: true }).lean();
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // return only public address (no private key ever)
  return res.json({
    success: true,
    user: {
      username: user.username,
      walletAddress: ethers.getAddress(user.walletAddress),
    },
  });
};


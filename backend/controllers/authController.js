'use strict';
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const { ethers } = require('ethers');
const { validationResult } = require('express-validator');
const User   = require('../models/User');
const logger = require('../utils/logger');

const SALT_ROUNDS = () => Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Safely resolve whatever is stored as walletAddress.
 * Handles: valid address, private key accidentally stored as address, garbage.
 */
const resolveWalletAddress = (raw) => {
  if (!raw) return null;
  if (/^0x[a-fA-F0-9]{40}$/.test(raw)) {
    try { return ethers.getAddress(raw); } catch { /* fall through */ }
  }
  if (/^(0x)?[a-fA-F0-9]{64}$/.test(raw)) {
    try {
      const key = raw.startsWith('0x') ? raw : `0x${raw}`;
      return new ethers.Wallet(key).address;
    } catch { /* fall through */ }
  }
  return null;
};

// ── POST /api/auth/register ──────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    const { fullName, email, password, username, pin, walletAddress, privateKey } = req.body;
    const normalUsername = username.toLowerCase().replace(/^@/, '').trim();

    // Use user-provided Ganache wallet + private key (local testing).
    // Ensure the private key corresponds to the provided wallet address.
    let derivedAddress = null;
    try {
      const pk = privateKey?.startsWith('0x') ? privateKey : `0x${privateKey}`;
      derivedAddress = new ethers.Wallet(pk).address;
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid private key' });
    }

    let checksumWallet = null;
    try {
      checksumWallet = ethers.getAddress(walletAddress);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid wallet address' });
    }

    if (derivedAddress.toLowerCase() !== checksumWallet.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Private key does not match the wallet address' });
    }

    // Check duplicates
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: normalUsername }],
    });
    if (existing) {
      const field = existing.username === normalUsername ? 'username' : 'email';
      return res.status(409).json({ success: false, message: `This ${field} is already registered` });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS());
    const pinHash      = (pin && String(pin).length >= 4)
      ? await bcrypt.hash(String(pin), SALT_ROUNDS())
      : undefined;

    const user = await User.create({
      fullName: fullName.trim(),
      email:    email.toLowerCase().trim(),
      passwordHash,
      username: normalUsername,
      walletAddress: checksumWallet,
      privateKey:    privateKey?.startsWith('0x') ? privateKey : `0x${privateKey}`,
      ...(pinHash && { pinHash }),
    });

    const token = signToken(user._id);
    logger.info(`Registered: @${normalUsername} | wallet: ${walletAddress}`);

    return res.status(201).json({ success: true, token, user: user.toPublic() });
  } catch (err) { next(err); }
};

// ── POST /api/auth/login ─────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    const { emailOrUsername, password } = req.body;
    const isEmail = emailOrUsername.includes('@') && emailOrUsername.indexOf('@') > 0;
    const lookup  = isEmail
      ? { email: emailOrUsername.toLowerCase() }
      : { username: emailOrUsername.toLowerCase().replace(/^@/, '') };

    const user = await User.findOne(lookup).select('+passwordHash');
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await user.verifyPassword(password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Fix any legacy bad wallet address silently on login
    const resolved = resolveWalletAddress(user.walletAddress);
    if (resolved && resolved !== user.walletAddress) {
      await User.findByIdAndUpdate(user._id, { walletAddress: resolved });
      user.walletAddress = resolved;
    }

    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    logger.info(`Login: @${user.username}`);

    return res.json({ success: true, token, user: user.toPublic() });
  } catch (err) { next(err); }
};

// ── GET /api/auth/me ─────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user: user.toPublic() });
  } catch (err) { next(err); }
};
'use strict';
const { validationResult } = require('express-validator');
const User          = require('../models/User');
const Transaction   = require('../models/Transaction');
const blockchainSvc = require('../services/blockchainService');
const logger        = require('../utils/logger');

const sumWeiToEth = (weiStr) => {
  try { return Number(require('ethers').ethers.formatEther(BigInt(weiStr || '0'))); }
  catch { return 0; }
};

// ── POST /api/payment/pay-by-username ────────────────────────────────
exports.payByUsername = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    const { toUsername, amountEth, message = '' } = req.body;

    const normalUsername = toUsername.toLowerCase().replace(/^@/, '').trim();
    const recipient = await User.findOne({ username: normalUsername, isActive: true });
    if (!recipient)
      return res.status(404).json({ success: false, message: `User @${normalUsername} not found` });

    // Fetch privateKey from DB — never from request body
    const sender = await User.findById(req.user.id).select('+privateKey');
    if (!sender)
      return res.status(404).json({ success: false, message: 'Sender account not found' });
    if (!sender.privateKey)
      return res.status(400).json({ success: false, message: 'Wallet not configured. Please re-register.' });

    if (sender.walletAddress.toLowerCase() === recipient.walletAddress.toLowerCase())
      return res.status(400).json({ success: false, message: 'You cannot send payment to yourself' });

    const amount = parseFloat(amountEth);
    if (isNaN(amount) || amount <= 0)
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });

    const receipt = await blockchainSvc.sendNativePayment({
      senderPrivateKey: sender.privateKey,
      receiverAddress:  recipient.walletAddress,
      amountEth:        String(amountEth),
    });

    const tx = await Transaction.create({
      txHash:            receipt.hash,
      type:              'send',
      senderAddress:     sender.walletAddress,
      senderUsername:    sender.username,
      recipientAddress:  recipient.walletAddress,
      recipientUsername: recipient.username,
      amountWei:         receipt.amountWei,
      note:              message || undefined,
      status:            'confirmed',
      blockNumber:       receipt.blockNumber,
      gasUsed:           receipt.gasUsed,
    });

    logger.info(`Payment: @${sender.username} → @${recipient.username} | ${amountEth} ETH`);
    return res.status(201).json({ success: true, message: 'Payment sent successfully', transaction: tx, recipient: recipient.toPublic() });
  } catch (err) { next(err); }
};

// ── POST /api/payment/pay-by-address ─────────────────────────────────
exports.payByAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    const { toAddress, amountEth, message = '' } = req.body;

    if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress))
      return res.status(400).json({ success: false, message: 'Invalid Ethereum address' });

    const sender = await User.findById(req.user.id).select('+privateKey');
    if (!sender)
      return res.status(404).json({ success: false, message: 'Sender account not found' });
    if (!sender.privateKey)
      return res.status(400).json({ success: false, message: 'Wallet not configured. Please re-register.' });

    if (sender.walletAddress.toLowerCase() === toAddress.toLowerCase())
      return res.status(400).json({ success: false, message: 'You cannot send payment to yourself' });

    const amount = parseFloat(amountEth);
    if (isNaN(amount) || amount <= 0)
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });

    const recipientUser = await User.findOne({ walletAddress: toAddress, isActive: true });

    const receipt = await blockchainSvc.sendNativePayment({
      senderPrivateKey: sender.privateKey,
      receiverAddress:  toAddress,
      amountEth:        String(amountEth),
    });

    const tx = await Transaction.create({
      txHash:            receipt.hash,
      type:              'send',
      senderAddress:     sender.walletAddress,
      senderUsername:    sender.username,
      recipientAddress:  receipt.to,
      recipientUsername: recipientUser?.username || null,
      amountWei:         receipt.amountWei,
      note:              message || undefined,
      status:            'confirmed',
      blockNumber:       receipt.blockNumber,
      gasUsed:           receipt.gasUsed,
    });

    logger.info(`Payment by address: @${sender.username} → ${toAddress} | ${amountEth} ETH`);
    return res.status(201).json({
      success:     true,
      message:     'Payment sent successfully',
      transaction: tx,
      recipient:   recipientUser ? recipientUser.toPublic() : { walletAddress: toAddress },
    });
  } catch (err) { next(err); }
};

// ── POST /api/payment/split-payment ──────────────────────────────────
exports.splitPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    const { recipients, groupNote = '' } = req.body;

    const resolved = await Promise.all(
      recipients.map(async ({ username, amountEth }) => {
        const u = await User.findOne({
          username: username.toLowerCase().replace(/^@/, '').trim(),
          isActive: true,
        });
        if (!u) {
          const err = new Error(`User @${username} not found`);
          err.statusCode = 404;
          throw err;
        }
        return { user: u, amountEth: String(amountEth) };
      })
    );

    const sender = await User.findById(req.user.id).select('+privateKey');
    if (!sender)
      return res.status(404).json({ success: false, message: 'Sender account not found' });
    if (!sender.privateKey)
      return res.status(400).json({ success: false, message: 'Wallet not configured. Please re-register.' });

    // Native split: send N separate transactions (Ganache).
    const hashes = [];
    const splitsWei = [];
    for (const r of resolved) {
      const receipt = await blockchainSvc.sendNativePayment({
        senderPrivateKey: sender.privateKey,
        receiverAddress:  r.user.walletAddress,
        amountEth:        String(r.amountEth),
      });
      hashes.push(receipt.hash);
      splitsWei.push(receipt.amountWei);
    }

    const totalWei = splitsWei.reduce((acc, w) => acc + BigInt(w), BigInt(0)).toString();

    const tx = await Transaction.create({
      // no single chain txHash for split batch
      type:           'split',
      senderAddress:  sender.walletAddress,
      senderUsername: sender.username,
      splits: resolved.map((r, i) => ({
        recipientAddress:  r.user.walletAddress,
        recipientUsername: r.user.username,
        amountWei:         splitsWei[i],
      })),
      totalAmountWei: totalWei,
      note:           groupNote || undefined,
      status:         'confirmed',
    });

    logger.info(`Split(native): @${sender.username} → ${resolved.length} recipients | hashes: ${hashes.join(', ')}`);
    return res.status(201).json({ success: true, message: 'Split payment sent', transaction: tx, txHashes: hashes });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

// ── GET /api/payment/history ─────────────────────────────────────────
exports.getHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
    const skip  = (page - 1) * limit;

    const filter = {
      $or: [
        { senderAddress:             user.walletAddress },
        { recipientAddress:          user.walletAddress },
        { 'splits.recipientAddress': user.walletAddress },
      ],
    };

    const [txs, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(filter),
    ]);

    return res.json({ success: true, transactions: txs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// ── GET /api/payment/stats ────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [balance, sentTxs, recvTxs, count] = await Promise.all([
      blockchainSvc.getBalance(user.walletAddress),
      Transaction.find({ type: 'send', senderAddress: user.walletAddress }, { amountWei: 1 }).lean(),
      Transaction.find({ type: 'send', recipientAddress: user.walletAddress }, { amountWei: 1 }).lean(),
      Transaction.countDocuments({
        $or: [
          { senderAddress: user.walletAddress },
          { recipientAddress: user.walletAddress },
          { 'splits.recipientAddress': user.walletAddress },
        ],
      }),
    ]);

    const sumWei = (txs) => txs.reduce((acc, t) => acc + BigInt(t.amountWei || '0'), BigInt(0)).toString();
    const sentWeiStr = sumWei(sentTxs);
    const recvWeiStr = sumWei(recvTxs);

    const stats = {
      sentWei:     sentWeiStr,
      receivedWei: recvWeiStr,
      sentEth:     String(sumWeiToEth(sentWeiStr)),
      receivedEth: String(sumWeiToEth(recvWeiStr)),
      count,
      balanceEth: balance.eth,
      balanceWei: balance.wei,
    };

    return res.json({ success: true, stats });
  } catch (err) { next(err); }
};
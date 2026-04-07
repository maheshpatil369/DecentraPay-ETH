'use strict';
const { validationResult } = require('express-validator');
const { ethers } = require('ethers');

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const blockchainSvc = require('../services/blockchainService');
const logger = require('../utils/logger');

// POST /api/payments/send
exports.send = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    const { receiverAddress, amountEth, senderPrivateKey, message = '' } = req.body;

    const sender = await User.findById(req.user.id).select('+privateKey');
    if (!sender) return res.status(404).json({ success: false, message: 'Sender account not found' });

    const pk = senderPrivateKey || sender.privateKey;
    if (!pk) return res.status(400).json({ success: false, message: 'Sender private key missing. Please re-register.' });

    // Basic safety: ensure request/privateKey matches logged-in user's wallet (helps avoid confusion)
    try {
      const derived = new ethers.Wallet(pk.startsWith('0x') ? pk : `0x${pk}`).address;
      if (derived.toLowerCase() !== sender.walletAddress.toLowerCase()) {
        return res.status(400).json({ success: false, message: 'Provided private key does not match your wallet address' });
      }
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid private key' });
    }

    if (sender.walletAddress.toLowerCase() === receiverAddress.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'You cannot send payment to yourself' });
    }

    const receipt = await blockchainSvc.sendNativePayment({
      senderPrivateKey: pk,
      receiverAddress,
      amountEth: String(amountEth),
    });

    const recipientUser = await User.findOne({ walletAddress: receipt.to, isActive: true }).lean();

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

    logger.info(`Native send: @${sender.username} → ${receipt.to} | ${amountEth} ETH | ${receipt.hash}`);

    return res.status(201).json({
      success: true,
      message: 'Payment sent successfully',
      transaction: {
        hash: receipt.hash,
        senderAddress: sender.walletAddress,
        receiverAddress: receipt.to,
        amountEth: receipt.amountEth,
      },
      dbTransaction: tx,
    });
  } catch (err) { next(err); }
};


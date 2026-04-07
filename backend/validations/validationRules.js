'use strict';
const { body } = require('express-validator');

exports.registerRules = [
  body('fullName').trim().notEmpty().withMessage('Full name required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password min 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('username')
    .trim().notEmpty().withMessage('Username required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^@?[a-zA-Z0-9_]+$/).withMessage('Username: letters, numbers, underscores only'),
  body('walletAddress')
    .trim().notEmpty().withMessage('Wallet address required')
    .matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid Ethereum wallet address'),
  body('privateKey')
    .trim().notEmpty().withMessage('Private key required')
    .matches(/^(0x)?[a-fA-F0-9]{64}$/).withMessage('Invalid private key format'),
  body('pin')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits')
    .isNumeric().withMessage('PIN must contain only numbers'),
];

exports.loginRules = [
  body('emailOrUsername').trim().notEmpty().withMessage('Email or username required'),
  body('password').notEmpty().withMessage('Password required'),
];

exports.payByUsernameRules = [
  body('toUsername').trim().notEmpty().withMessage('Recipient username required'),
  body('amountEth')
    .notEmpty().withMessage('Amount required')
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('message')
    .optional().isLength({ max: 256 }).withMessage('Message max 256 characters'),
];

exports.payByAddressRules = [
  body('toAddress')
    .trim().notEmpty().withMessage('Recipient address required')
    .matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid Ethereum address'),
  body('amountEth')
    .notEmpty().withMessage('Amount required')
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('message')
    .optional().isLength({ max: 256 }).withMessage('Message max 256 characters'),
];

exports.sendPaymentRules = [
  body('receiverAddress')
    .trim().notEmpty().withMessage('Receiver address required')
    .matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid receiver address'),
  body('amountEth')
    .notEmpty().withMessage('Amount required')
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('senderPrivateKey')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^(0x)?[a-fA-F0-9]{64}$/).withMessage('Invalid private key format'),
  body('message')
    .optional().isLength({ max: 256 }).withMessage('Message max 256 characters'),
];

exports.splitPaymentRules = [
  body('recipients')
    .isArray({ min: 2 }).withMessage('At least 2 recipients required'),
  body('recipients.*.username')
    .trim().notEmpty().withMessage('Each recipient needs a username'),
  body('recipients.*.amountEth')
    .isFloat({ gt: 0 }).withMessage('Each amount must be greater than 0'),
  body('groupNote')
    .optional().isLength({ max: 256 }),
];

exports.pinRules = [
  body('pin')
    .notEmpty().withMessage('PIN required')
    .isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits')
    .isNumeric().withMessage('PIN must contain only numbers'),
];

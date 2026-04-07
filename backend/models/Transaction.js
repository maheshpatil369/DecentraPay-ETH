'use strict';
const mongoose = require('mongoose');

const splitItemSchema = new mongoose.Schema({
  recipientAddress:  { type: String, required: true },
  recipientUsername: { type: String },
  amountWei:         { type: String, required: true }, // stored as string to avoid precision loss
}, { _id: false });

const transactionSchema = new mongoose.Schema(
  {
    txHash:   { type: String, unique: true, sparse: true },
    type:     { type: String, enum: ['send', 'split'], required: true },

    // Sender info
    senderAddress:  { type: String, required: true, index: true },
    senderUsername: { type: String },

    // For type === 'send'
    recipientAddress:  { type: String, index: true },
    recipientUsername: { type: String },
    amountWei:         { type: String },  // Wei as string

    // For type === 'split'
    splits:     [splitItemSchema],
    totalAmountWei: { type: String },

    note:        { type: String, maxlength: 256 },
    status:      { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
    blockNumber: { type: Number },
    gasUsed:     { type: String },
  },
  { timestamps: true }
);

transactionSchema.index({ senderAddress:    1, createdAt: -1 });
transactionSchema.index({ recipientAddress: 1, createdAt: -1 });
transactionSchema.index({ 'splits.recipientAddress': 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

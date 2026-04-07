'use strict';
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String, required: [true, 'Full name is required'],
      trim: true, maxlength: [100, 'Name too long'],
    },
    email: {
      type: String, required: [true, 'Email is required'],
      unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    passwordHash: {
      type: String, required: true,
      select: false,
    },
    username: {
      type: String, required: [true, 'Username is required'],
      unique: true, lowercase: true, trim: true,
      minlength: [3,  'Username min 3 characters'],
      maxlength: [30, 'Username max 30 characters'],
      match: [/^[a-z0-9_]+$/, 'Username: letters, numbers, underscores only'],
    },
    walletAddress: {
      type: String, required: [true, 'Wallet address is required'],
      unique: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'],
    },
    // Stored for backend signing — NEVER returned in toPublic()
    privateKey: {
      type:   String,
      select: false,
    },
    pinHash: {
      type: String,
      select: false,
    },
    profileImage: { type: String, default: null },
    avatarColor: {
      type: String,
      default: () => `hsl(${Math.floor(Math.random() * 360)},60%,50%)`,
    },
    isActive:  { type: Boolean, default: true },
    lastSeen:  { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ username: 1 });
userSchema.index({ username: 'text' });
userSchema.index({ email: 1 });
userSchema.index({ walletAddress: 1 });

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.verifyPin = function (plain) {
  if (!this.pinHash) return Promise.resolve(false);
  return bcrypt.compare(String(plain), this.pinHash);
};

/** Safe public view — NEVER leaks passwordHash, pinHash, or privateKey */
userSchema.methods.toPublic = function () {
  return {
    id:            this._id,
    fullName:      this.fullName,
    email:         this.email,
    username:      this.username,
    walletAddress: this.walletAddress,
    profileImage:  this.profileImage,
    avatarColor:   this.avatarColor,
    createdAt:     this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
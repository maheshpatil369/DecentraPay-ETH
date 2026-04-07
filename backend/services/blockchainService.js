'use strict';
const { ethers } = require('ethers');
const logger = require('../utils/logger');

// ── Singleton provider (Ganache) — no ENS ─────────────────────────────
let _provider = null;
const getProvider = () => {
  if (!_provider) _provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
  return _provider;
};

const safeFormatEther = (wei) => {
  try { return ethers.formatEther(BigInt(wei.toString())); }
  catch { return '0'; }
};

/** Validate + checksum address — throws if invalid, never does ENS */
const validateAddress = (addr) => {
  if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr))
    throw new Error(`Invalid Ethereum address: ${addr}`);
  return ethers.getAddress(addr);
};

/** Normalize + validate private key */
const normalizePrivateKey = (pk) => {
  if (!pk) throw new Error('Private key required');
  const key = pk.startsWith('0x') ? pk : `0x${pk}`;
  if (!/^(0x)?[a-fA-F0-9]{64}$/.test(key)) throw new Error('Invalid private key format');
  return key;
};

// ── getBalance ────────────────────────────────────────────────────────
exports.getBalance = async (walletAddress) => {
  try {
    const addr    = validateAddress(walletAddress);
    const balance = await getProvider().getBalance(addr);
    return { wei: balance.toString(), eth: ethers.formatEther(balance) };
  } catch (err) {
    logger.warn(`[BC] getBalance failed for ${walletAddress}: ${err.message}`);
    return { wei: '0', eth: '0.0000' };
  }
};

// ── sendNativePayment (Ganache ETH transfer) ──────────────────────────
exports.sendNativePayment = async ({ senderPrivateKey, receiverAddress, amountEth }) => {
  const pk      = normalizePrivateKey(senderPrivateKey);
  const to      = validateAddress(receiverAddress);
  const amountWei = ethers.parseEther(String(amountEth));

  const wallet = new ethers.Wallet(pk, getProvider());
  logger.info(`[BC] sendNativePayment ${wallet.address} → ${to} | ${amountEth} ETH`);

  const tx = await wallet.sendTransaction({ to, value: amountWei });
  const receipt = await tx.wait();

  return {
    hash:        tx.hash,
    from:        wallet.address,
    to,
    amountWei:   amountWei.toString(),
    amountEth:   String(amountEth),
    blockNumber: receipt?.blockNumber,
    gasUsed:     receipt?.gasUsed?.toString?.() || undefined,
  };
};

// ── Helpers ───────────────────────────────────────────────────────────
exports._internal = {
  getProvider,
  validateAddress,
  normalizePrivateKey,
  safeFormatEther,
};
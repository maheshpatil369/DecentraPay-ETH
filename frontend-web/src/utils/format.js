import { ethers } from 'ethers';

export const normaliseUsername = (raw = '') =>
  raw.trim().toLowerCase().replace(/^@+/, '');

export const fmtEth = (val) => {
  const n = parseFloat(val || 0);
  if (isNaN(n)) return '0.000000';
  return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
};

/** Safely format a Wei value (string | bigint | number) to ETH */
export const weiToEth = (wei) => {
  if (!wei) return '0.0000';
  try {
    return parseFloat(ethers.formatEther(BigInt(wei.toString()))).toFixed(6);
  } catch {
    return '0.0000';
  }
};

export const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const shortAddr = (addr = '') =>
  addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

export const isValidEthAddress = (addr) =>
  /^0x[a-fA-F0-9]{40}$/.test(addr);

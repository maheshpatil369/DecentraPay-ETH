'use strict';
/**
 * DecentraPay smart-contract ABI and network config.
 * Uses ethers.js v6 throughout the project.
 */

const ABI = [
  {
    "inputs": [
      { "internalType": "address payable", "name": "recipient", "type": "address" },
      { "internalType": "string",          "name": "message",   "type": "string"  }
    ],
    "name": "sendPayment",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address payable[]", "name": "recipients", "type": "address[]" },
      { "internalType": "uint256[]",          "name": "amounts",    "type": "uint256[]" },
      { "internalType": "string",             "name": "groupNote",  "type": "string"   }
    ],
    "name": "splitPayment",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "wallet", "type": "address" }],
    "name": "walletStats",
    "outputs": [
      { "internalType": "uint256", "name": "sent",     "type": "uint256" },
      { "internalType": "uint256", "name": "received", "type": "uint256" },
      { "internalType": "uint256", "name": "count",    "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs":  [],
    "name":    "totalVolume",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "from",      "type": "address" },
      { "indexed": true,  "internalType": "address", "name": "to",        "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount",    "type": "uint256" },
      { "indexed": false, "internalType": "string",  "name": "message",   "type": "string"  },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "PaymentSent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address",           "name": "sender",     "type": "address"   },
      { "indexed": false, "internalType": "address payable[]", "name": "recipients", "type": "address[]" },
      { "indexed": false, "internalType": "uint256[]",         "name": "amounts",    "type": "uint256[]" },
      { "indexed": false, "internalType": "string",            "name": "note",       "type": "string"    },
      { "indexed": false, "internalType": "uint256",           "name": "timestamp",  "type": "uint256"   }
    ],
    "name": "SplitPayment",
    "type": "event"
  },
  { "stateMutability": "payable", "type": "receive" }
];

module.exports = {
  ABI,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '',
  GANACHE_RPC_URL:  process.env.GANACHE_RPC_URL  || 'http://127.0.0.1:7545',
};

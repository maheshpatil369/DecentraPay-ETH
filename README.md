# DecentraPay 🔗

Production-grade decentralised payment platform — username payments, QR codes, split bills, app lock — built on Ethereum (Ganache) with Node.js + React (Tailwind CSS) + React Native + Ethers.js v6.

---

## Quick Start (5 steps)

### Prerequisites
| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| MongoDB | ≥ 7.x (running locally) |
| Ganache Desktop | Latest (port 7545) |
| Expo CLI | `npm i -g expo-cli` |

---

### 1. Clone & configure
```bash
cd DecentraPay
cp .env.example .env
```
Edit `.env` and set at minimum:
- `JWT_SECRET` — any random 64-char string
- `MONGO_URI` — `mongodb://127.0.0.1:27017/decentrapay`
- `GANACHE_RPC_URL` — `http://127.0.0.1:7545`
- `DEPLOYER_PRIVATE_KEY` — first account private key from Ganache

---

### 2. Deploy smart contract
```bash
cd smart-contract
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network ganache
# CONTRACT_ADDRESS is auto-written to .env
```

---

### 3. Start backend
```bash
cd ../backend
npm install
npm run dev
# API: http://localhost:5000
```

---

### 4. Start web frontend
```bash
cd ../frontend-web
npm install
npm start
# Opens: http://localhost:3000
```

---

### 5. Start mobile app
```bash
cd ../mobile-app
npm install
# Edit src/services/api.js → set API_BASE to your LAN IP
# Android emulator: http://10.0.2.2:5000/api
# iOS simulator:    http://localhost:5000/api
# Physical device:  http://192.168.x.x:5000/api
npx expo start
```

---

## Bug Fixes vs Previous Version

| Issue | Fix |
|-------|-----|
| `ethers` version inconsistency | Pinned to `6.11.1` everywhere |
| `require('ethers')` inside JSX render | Moved to top-level import, `weiToEth()` helper |
| `BigInt` reduction crash in split | Uses `BigInt(0)` seed correctly |
| No Tailwind CSS | Full Tailwind v3 + `postcss.config.js` + `tailwind.config.js` |
| No `html5-qrcode` in package.json | Added `html5-qrcode@2.3.8` |
| Double `NavigationContainer` in mobile | Single container in `App.js` only |
| Expo SDK 51 camera API | Uses `expo-camera` + `expo-barcode-scanner` correct API |
| No `babel.config.js` in mobile | Added |
| `jest.config.json` setup file missing | Added `tests/setup.js` |
| Hardhat `dotenv` path wrong | Fixed to `path.resolve(__dirname, "../.env")` |
| `AppLockContext` calls API before token exists | Uses lazy `require()` inside `verifyPin` |
| Logs dir didn't exist on first run | Auto-created in `app.js` |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login → JWT |
| GET  | `/api/auth/me` 🔒 | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search?username=` 🔒 | Prefix search |
| GET | `/api/users/:username` 🔒 | Resolve @username |
| GET | `/api/users/address/:address` 🔒 | Reverse lookup |
| PUT | `/api/users/profile` 🔒 | Update profile |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/pay-by-username` 🔒 | Username payment |
| POST | `/api/payment/split-payment` 🔒 | Split payment |
| GET  | `/api/payment/history` 🔒 | Tx history |
| GET  | `/api/payment/stats` 🔒 | On-chain wallet stats |

### Security
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/security/verify-pin` 🔒 | Verify PIN |
| POST | `/api/security/set-pin` 🔒 | Set / update PIN |

---

## Architecture

```
Frontend (React + Tailwind)
    │  POST /api/payment/pay-by-username
    ▼
Backend (Express + Mongoose)
    │  1. Find recipient by @username → MongoDB
    │  2. Call blockchainService.sendPayment()
    ▼
Ethers.js v6 (blockchainService.js)
    │  contract.sendPayment(address, msg, { value })
    ▼
DecentraPay.sol (Ganache)
    ✅ ETH transferred
    ✅ Events emitted
    ▲
Backend persists Transaction to MongoDB
    ▲
Frontend shows confirmation
```

---

## Security

| Layer | Implementation |
|-------|---------------|
| Passwords | bcrypt 12 rounds |
| PINs | bcrypt 12 rounds, `select:false` |
| JWT | 7-day expiry, Bearer token |
| Private keys | Never stored — dev only, use MetaMask in prod |
| Rate limits | Auth: 20/15min, Pay: 10/min, Search: 40/min |
| Headers | Helmet.js |
| CORS | Locked to `CLIENT_ORIGIN` |
| Validation | express-validator on every route |

---

## Running Tests

```bash
# Backend API tests
cd backend && npm test

# Smart contract tests  
cd smart-contract && npx hardhat test
```

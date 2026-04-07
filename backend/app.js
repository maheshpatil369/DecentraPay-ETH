'use strict';
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const path         = require('path');
const fs           = require('fs');

const connectDB    = require('./config/database');
const logger       = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Connect DB
connectDB();

const app = express();

// ── Security ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsing ──────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── HTTP Logging ──────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Global Rate Limit ─────────────────────────────────────────────────
app.use(rateLimit({
  windowMs:        Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:             Number(process.env.RATE_LIMIT_MAX)        || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, message: 'Too many requests, please try again later.' },
}));

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/users',    require('./routes/userRoutes'));
app.use('/api/payment',  require('./routes/paymentRoutes'));
app.use('/api/payments', require('./routes/paymentsRoutes'));
app.use('/api/qr',       require('./routes/qrRoutes'));
app.use('/api/security', require('./routes/securityRoutes'));

// ── Health Check ──────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;

'use strict';
const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  logger.error(`${err.message} | ${req.method} ${req.originalUrl}`, { stack: err.stack });

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const msgs = Object.values(err.errors).map(e => e.message);
    return res.status(422).json({ success: false, message: msgs.join(', ') });
  }

  // Ethers / blockchain errors
  if (err.code === 'CALL_EXCEPTION' || err.code === 'INSUFFICIENT_FUNDS') {
    return res.status(400).json({ success: false, message: `Blockchain error: ${err.reason || err.message}` });
  }

  const status = err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

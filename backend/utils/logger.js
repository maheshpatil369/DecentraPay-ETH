'use strict';
const { createLogger, format, transports } = require('winston');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp }) =>
          `${timestamp} [${level}] ${message}`
        )
      ),
    }),
    new transports.File({ filename: path.join(LOG_DIR, 'error.log'),    level: 'error' }),
    new transports.File({ filename: path.join(LOG_DIR, 'combined.log') }),
  ],
});

module.exports = logger;

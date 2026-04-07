'use strict';
require('dotenv').config();
const app    = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`DecentraPay API  →  http://localhost:${PORT}  [${process.env.NODE_ENV || 'development'}]`);
});
app.set('trust proxy', 1);
// Graceful shutdown
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('SIGINT',  () => { server.close(() => process.exit(0)); });

module.exports = server;

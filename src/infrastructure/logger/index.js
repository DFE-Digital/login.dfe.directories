'use strict';

const winston = require('winston');
const config = require('./../config')();

const logLevel = (config && config.loggerSettings && config.loggerSettings.logLevel) ? config.loggerSettings.logLevel : 'info';

const logger = new (winston.Logger)({
  colors: (config && config.loggerSettings && config.loggerSettings.colors) ? config.loggerSettings.colors : null,
  transports: [
    new (winston.transports.Console)({ level: logLevel, colorize: true }),
  ],
});

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at:', p, 'reason:', reason);
});

module.exports = logger;

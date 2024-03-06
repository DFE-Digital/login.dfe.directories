'use strict';

const { createLogger, transports, format} = require('winston');
const config = require('./../config');
const appInsights = require('applicationinsights');
const AppInsightsTransport = require('login.dfe.winston-appinsights');
const AuditTransporter = require('login.dfe.audit.transporter');
const logLevel = (config && config.loggerSettings && config.loggerSettings.logLevel) ? config.loggerSettings.logLevel : 'info';

const customLevels = {
  levels: {
    audit: 0,
    error: 1,
    warn: 2,
    info: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    info: 'yellow',
    ok: 'green',
    error: 'red',
    audit: 'magenta',
  },
};

const loggerConfig = {
  levels: customLevels.levels,
  colorize: true,
  format: format.combine(
    format.simple(),
  ),
  transports: [],
};

// const sequelizeTransport = WinstonSequelizeTransport(config);

// if (sequelizeTransport) {
//   loggerConfig.transports.push(sequelizeTransport);
// }
loggerConfig.transports.push(new transports.Console({ level: logLevel, colorize: true }));

const opts = { application: config.loggerSettings.applicationName, level: 'audit' };
const auditTransport = AuditTransporter(opts);

if (auditTransport) {
  loggerConfig.transports.push(auditTransport);
}
if (config && config.loggerSettings && config.loggerSettings.redis && config.loggerSettings.redis.enabled) {
  loggerConfig.transports.push(new transports.Redis({
    level: 'audit',
    length: 4294967295,
    host: config.loggerSettings.redis.host,
    port: config.loggerSettings.redis.port,
    auth: config.loggerSettings.redis.auth,
  }));
}

if (config.hostingEnvironment.applicationInsights) {
  appInsights.setup(config.hostingEnvironment.applicationInsights)
    .setAutoCollectConsole(false, false)
    .setSendLiveMetrics(config.loggerSettings.aiSendLiveMetrics || false)
    .start();
  loggerConfig.transports.push(new AppInsightsTransport({
    client: appInsights.defaultClient,
    applicationName: config.loggerSettings.applicationName || 'Directories',
    type: 'event',
    treatErrorsAsExceptions: true,
  }));
}

const logger = createLogger(loggerConfig);

process.on('unhandledRejection', (reason, p) => {
  logger.error('Error occurred processing: ', p, 'reason: ', reason);
});

module.exports = logger;

const WinstonSequelizeTransport = require("login.dfe.audit.winston-sequelize-transport");
const {
  setupApplicationInsights,
  setupLogging,
} = require("login.dfe.api-client/logging");
const config = require("../config");
const AuditTransporter = require("login.dfe.audit.transporter");

const additionalTransports = [];

const sequelizeTransport = WinstonSequelizeTransport(config);
if (sequelizeTransport) {
  additionalTransports.push(sequelizeTransport);
}

if (config.hostingEnvironment.applicationInsights) {
  setupApplicationInsights(config.hostingEnvironment.applicationInsights);
}

const applicationName = config.loggerSettings.applicationName || "Directories";

additionalTransports.push(
  AuditTransporter({
    application: applicationName,
    level: "audit",
  }),
);

module.exports = setupLogging({
  applicationName: applicationName,
  logLevel: process.env.LOG_LEVEL,
  additionalTransports,
});

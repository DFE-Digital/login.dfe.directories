const alwaysOnFilter = require("./middleware/alwaysOnFilter");
const config = require("./infrastructure/config");
const logger = require("./infrastructure/logger");
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const https = require("https");
const users = require("./app/user/api");
const userCodes = require("./app/userCodes/api");
const invitations = require("./app/invitations/api");
const healthCheck = require("login.dfe.healthcheck");
const { getErrorHandler } = require("login.dfe.express-error-handling");
const configSchema = require("./infrastructure/config/schema");

const {
  entraExternalAuthProvider,
} = require("login.dfe.entra-auth-extensions/provider");

const { setupApi } = require("login.dfe.api-client/api/setup");

https.globalAgent.maxSockets = http.globalAgent.maxSockets =
  config.hostingEnvironment.agentKeepAlive.maxSockets || 50;

configSchema.validate();

setupApi({
  auth: {
    tenant: config.applications.service.auth.tenant,
    authorityHostUrl: config.applications.service.auth.authorityHostUrl,
    clientId: config.applications.service.auth.clientId,
    clientSecret: config.applications.service.auth.clientSecret,
    resource: config.applications.service.auth.resource,
  },
  api: {
    applications: {
      baseUri: config.applications.service.url,
    },
  },
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(alwaysOnFilter());

app.use(
  "/healthcheck",
  healthCheck({
    config,
  }),
);

app.use(
  entraExternalAuthProvider({
    msal: {
      cloudInstance: config.entra.cloudInstance,
      tenantId: config.entra.tenantId,
      clientId: config.entra.clientId,
      clientSecret: config.entra.clientSecret,
    },
    graphApi: {
      endpoint: config.entra.graphEndpoint,
    },
  }),
);

// TODO Once the deprecated APIs are gone, this mount can be /users...
app.use("/", users);
app.use("/userCodes", userCodes);
app.use("/invitations", invitations);

// Error handing
app.use(
  getErrorHandler({
    logger,
  }),
);

if (config.hostingEnvironment.env === "dev") {
  app.proxy = true;
  const options = {
    key: config.hostingEnvironment.sslKey,
    cert: config.hostingEnvironment.sslCert,
    requestCert: false,
    rejectUnauthorized: false,
  };
  const server = https.createServer(options, app);

  server.listen(config.hostingEnvironment.port, () => {
    logger.info(
      `Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`,
    );
  });
} else {
  app.listen(process.env.PORT, () => {
    logger.info(
      `Server listening on http://${config.hostingEnvironment.host}:${process.env.PORT}`,
    );
  });
}

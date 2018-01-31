'use strict';

const config = require('./infrastructure/config');
const logger = require('./infrastructure/logger');
const appInsights = require('applicationinsights');
const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const users = require('./app/user/api');
const userCodes = require('./app/userCodes/api');
const invitations = require('./app/invitations/api');
const dev = require('./app/dev');
const healthCheck = require('login.dfe.healthcheck');


const { directoriesSchema, validateConfigAndQuitOnError } = require('login.dfe.config.schema');

validateConfigAndQuitOnError(directoriesSchema, config, logger);

if (config.hostingEnvironment.applicationInsights) {
  appInsights.setup(config.hostingEnvironment.applicationInsights).start();
}

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/healthcheck', healthCheck({
  config,
}));

if (config.hostingEnvironment.useDevViews) {
  app.use(expressLayouts);
  app.set('view engine', 'ejs');
  app.set('views', path.resolve(__dirname, 'app'));
  app.set('layout', 'layouts/layout');

  app.get('/', (req, res) => {
    res.redirect('/manage');
  });
  app.use('/manage', dev);
}

// TODO Once the deprecated APIs are gone, this mount can be /users...
app.use('/', users);
app.use('/userCodes', userCodes);
app.use('/invitations', invitations);


if (config.hostingEnvironment.env === 'dev') {
  app.proxy = true;
  const options = {
    key: config.hostingEnvironment.sslKey,
    cert: config.hostingEnvironment.sslCert,
    requestCert: false,
    rejectUnauthorized: false,
  };
  const server = https.createServer(options, app);

  server.listen(config.hostingEnvironment.port, () => {
    logger.info(`Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`);
  });
} else {
  app.listen(process.env.PORT, () => {
    logger.info(`Server listening on http://${config.hostingEnvironment.host}:${process.env.PORT}`);
  });
}

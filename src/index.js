'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const api = require('./app/user/api');
const config = require('./infrastructure/config')();
const logger = require('./infrastructure/logger');
const https = require('https');
const userCodes = require('./app/userCodes/api');
const invitation = require('./app/invitations/api');
const dev = require('./app/dev');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


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
app.use('/', api);
app.use('/userCodes', userCodes);
app.use('/invitation', invitation);

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
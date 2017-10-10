'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const api = require('./api');
const config = require('./config');
const logger = require('./logger');
const https = require('https');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use('/', api);

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
'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../../infrastructure/config');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const getDevice = require('./getDevice');
const listDevices = require('./listDevices');

const router = express.Router();

const routes = () => {
  // Add auth middleware
  if (config.hostingEnvironment.env !== 'dev') {
    router.use('/', apiAuth(router, config));
  }

  // Map routes to functions.
  router.get('/:type/:serial_number', asyncWrapper(getDevice));
  router.get('/', asyncWrapper(listDevices));

  return router;
};

module.exports = routes();

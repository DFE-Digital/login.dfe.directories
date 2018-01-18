'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../../infrastructure/config');
const { deprecateWith } = require('./../../../utils');

const list = require('./list');
const authenticate = require('./authenticate');
const changePassword = require('./changePassword');
const find = require('./find');
const search = require('./search');
const getDevices = require('./getDevices');
const createDevice = require('./createDevice');
const activateUser = require('./activateUser');
const deactivateUser = require('./deactivateUser');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware
  if (config.hostingEnvironment.env !== 'dev') {
    router.use('/', apiAuth(router, config));
  }

  // Map routes to functions.
  router.get('/:directoryId/user/:id', deprecateWith('/users/:id'), find);
  router.get('/users', list);
  router.get('/users/by-ids', search);
  router.get('/users/:id', find);

  router.post('/:directoryId/user/authenticate', deprecateWith('/users/authenticate'), authenticate);
  router.post('/users/authenticate', authenticate);

  router.post('/:directoryId/user/:id/changepassword', deprecateWith('/users/:id/changepassword'), changePassword);
  router.post('/users/:id/changepassword', changePassword);

  router.post('/users/:id/deactivate', deactivateUser);
  router.post('/users/:id/activate', activateUser);

  router.get('/users/:id/devices', getDevices);
  router.post('/users/:id/devices', createDevice);

  return router;
};

module.exports = routeExport();

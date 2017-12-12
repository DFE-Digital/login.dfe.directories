'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../../infrastructure/config');
const { deprecateWith } = require('./../../../utils');
const authenticate = require('./authenticate');
const changePassword = require('./changePassword');
const find = require('./find');
const search = require('./search');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware
  if (config.hostingEnvironment.env !== 'dev') {
    router.use('/', apiAuth(router, config));
  }

  // Map routes to functions.
  router.get('/:directoryId/user/:id', deprecateWith('/users/:id'), find);
  router.get('/users/by-ids', search);
  router.get('/users/:id', find);

  router.post('/:directoryId/user/authenticate', deprecateWith('/users/authenticate'), authenticate);
  router.post('/users/authenticate', authenticate);

  router.post('/:directoryId/user/:id/changepassword', deprecateWith('/users/:id/changepassword'), changePassword);
  router.post('/users/:id/changepassword', changePassword);

  return router;
};

module.exports = routeExport();

'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../../infrastructure/config')();
const authenticate = require('./authenticate');
const changePassword = require('./changePassword');
const find = require('./find');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  router.use('/', apiAuth(router, config));

  // Map routed to functions.
  router.get('/:directoryId/user/:id', find);
  router.post('/:directoryId/user/authenticate', authenticate);
  router.post('/:directoryId/user/:id/changepassword', changePassword);

  return router;
};

module.exports = routeExport();

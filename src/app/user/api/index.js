'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../../infrastructure/config')();
const {deprecate} = require('./../../../utils');
const authenticate = require('./authenticate');
const changePassword = require('./changePassword');
const find = require('./find');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  router.use('/', apiAuth(router, config));

  // Map routed to functions.
  router.get('/:directoryId/user/:id', deprecate('/users/:id'), find);
  router.post('/:directoryId/user/authenticate', deprecate('/users/authenticate'), authenticate);
  router.post('/:directoryId/user/:id/changepassword', deprecate('/users/:id/changepassword'), changePassword);

  router.get('/users/:id', find);
  router.post('/users/authenticate', authenticate);
  router.post('/users/:id/changepassword', changePassword);

  return router;
};

module.exports = routeExport();

'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../config');
const authenticate = require('./authenticate');
const findById = require('./findById');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  router.use(apiAuth(router, config));

  // Map routed to functions.
  router.get('/:directoryId/user/:id', findById);
  router.post('/:directoryId/user/authenticate', authenticate);

  return router;
};

module.exports = routeExport();

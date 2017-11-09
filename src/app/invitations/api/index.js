'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../../infrastructure/config')();
const putUpsertInvitation = require('./putUpsertInvitation');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  router.use(apiAuth(router, config));

  // Map routed to functions.
  router.put('/upsert', putUpsertInvitation);
  return router;
};

module.exports = routeExport();

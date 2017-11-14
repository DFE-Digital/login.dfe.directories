'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../../infrastructure/config')();
const postInvitation = require('./postInvitation');

const assert = require('assert');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  router.use('/', apiAuth(router, config));

  assert(config.invitations.redisUrl, 'the invitations.redisUrl config property must be set');

  // Map routed to functions.
  router.post('/', postInvitation);
  return router;
};

module.exports = routeExport();

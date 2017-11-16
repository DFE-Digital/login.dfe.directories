'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../../infrastructure/config')();
const postInvitations = require('./postInvitations');
const getInvitations = require('./getInvitations');
const createUser = require('./createUser');
const assert = require('assert');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  router.use('/', apiAuth(router, config));

  assert(config.invitations.redisUrl, 'the invitations.redisUrl config property must be set');

  // Map routed to functions.
  router.post('/', postInvitations);
  router.get('/:id', getInvitations);
  router.post('/:id/create_user', createUser);
  return router;
};

module.exports = routeExport();

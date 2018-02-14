'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../../infrastructure/config');
const listInvitations = require('./listInvitations');
const postInvitations = require('./postInvitations');
const getInvitations = require('./getInvitation');
const createUser = require('./createUser');
const patchInvitation = require('./patchInvitation');
const assert = require('assert');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  if (config.hostingEnvironment.env !== 'dev') {
    router.use('/', apiAuth(router, config));
  }
  assert(config.invitations.redisUrl, 'the invitations.redisUrl config property must be set');

  // Map routed to functions.
  router.get('/', listInvitations);
  router.post('/', postInvitations);
  router.get('/:id', getInvitations);
  router.patch('/:id', patchInvitation);
  router.post('/:id/create_user', createUser);
  return router;
};

module.exports = routeExport();

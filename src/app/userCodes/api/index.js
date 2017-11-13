'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../../infrastructure/config')();
const putUpsertCode = require('./putUpsertCode');
const deleteCode = require('./delete');
const validateCode = require('./validate');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  router.use('/', apiAuth(router, config));

  // Map routed to functions.
  router.put('/upsert', putUpsertCode);
  router.get('/validate/:uid/:code', validateCode);
  router.delete('/:uid', deleteCode);
  return router;
};

module.exports = routeExport();

'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('./../../../infrastructure/config');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const putUpsertCode = require('./putUpsertCode');
const deleteCode = require('./delete');
const validateCode = require('./validate');
const getCode = require('./get');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  if (config.hostingEnvironment.env !== 'dev') {
    router.use('/', apiAuth(router, config));
  }
  // Map routed to functions.
  router.get('/:uid', asyncWrapper(getCode));
  router.put('/upsert', asyncWrapper(putUpsertCode));
  router.get('/validate/:uid/:code', asyncWrapper(validateCode));
  router.delete('/:uid', asyncWrapper(deleteCode));
  return router;
};

module.exports = routeExport();

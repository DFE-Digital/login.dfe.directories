const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const { asyncWrapper } = require('login.dfe.express-error-handling');
const config = require('../../../infrastructure/config');

const patchEntraIdUser = require('./patchEntraIdUser');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  if (config.hostingEnvironment.env !== 'dev') {
    router.use('/', apiAuth(router, config));
  }

  // Map routed to functions.
  router.patch('/:entraSub', asyncWrapper(patchEntraIdUser));
  return router;
};

module.exports = routeExport();

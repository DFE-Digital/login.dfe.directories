const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const { asyncWrapper } = require('login.dfe.express-error-handling');
const config = require('../../../infrastructure/config');

const patchEntraIdUser = require('./patchEntraIdUser');
const getCreateAccountUrl = require('./getCreateAccountUrl');
const getEntraIdUser = require('./getEntraIdUser');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  if (config.hostingEnvironment.env !== 'dev') {
    router.use('/', apiAuth(router, config));
  }

  // Map routed to functions.
  // router.get('/createAccountUrl', asyncWrapper(getCreateAccountUrl));
  router.get('/users/:userId', asyncWrapper(getEntraIdUser));
  router.patch('/users/:entraSub', asyncWrapper(patchEntraIdUser));
  return router;
};

module.exports = routeExport();

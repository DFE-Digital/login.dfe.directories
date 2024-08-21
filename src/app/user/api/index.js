'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const { asyncWrapper } = require('login.dfe.express-error-handling');
const config = require('../../../infrastructure/config');
const { deprecateWith } = require('../../../utils');

const list = require('./list');
const authenticate = require('./authenticate');
const changePassword = require('./changePassword');
const find = require('./find');
const search = require('./search');
const activateUser = require('./activateUser');
const deactivateUser = require('./deactivateUser');
const patchUser = require('./patchUser');
const createUser = require('./createUser');
const findByLegacyUsername = require('./findByLegacyUsername');
const findLegacyUsernamesById = require('./findLegacyUsernames');
const searchV2 = require('./searchV2');
const getUserPasswordPolicies = require('./getUserPasswordPolicies');
const passwordHistory = require('./getPasswordHistory');
const matchedPassphrase = require('./matchedPassphrase');
const findByEntraOid = require('./findByEntraOidHandler');
const linkDsiUserWithEntra = require('./linkDsiUserWithEntraHandler');

const router = express.Router();

const routeExport = () => {
  // Add auth middleware
  if (config.hostingEnvironment.env !== 'dev') {
    router.use('/', apiAuth(router, config));
  }

  // Map routes to functions.
  router.get('/:directoryId/user/:id', deprecateWith('/users/:id'), asyncWrapper(find));
  router.get('/users', asyncWrapper(list));
  router.post('/users', asyncWrapper(createUser));
  router.get('/users/by-ids', asyncWrapper(search));
  router.post('/users/by-ids', asyncWrapper(searchV2));
  router.get('/users/by-legacyusername/:id', asyncWrapper(findByLegacyUsername));
  router.get('/users/:id', asyncWrapper(find));
  router.get('/users/:uid/legacy-username', asyncWrapper(findLegacyUsernamesById));
  router.post('/users/:uid/match-phrase', asyncWrapper(matchedPassphrase));
  router.get('/users/:uid/password-policies', asyncWrapper(getUserPasswordPolicies));
  router.get('/users/:uid/password-history', asyncWrapper(passwordHistory));
  router.post('/:directoryId/user/authenticate', deprecateWith('/users/authenticate'), asyncWrapper(authenticate));
  router.post('/users/authenticate', asyncWrapper(authenticate));

  router.post('/:directoryId/user/:id/changepassword', deprecateWith('/users/:id/changepassword'), asyncWrapper(changePassword));
  router.patch('/users/:id', asyncWrapper(patchUser));
  router.post('/users/:id/changepassword', asyncWrapper(changePassword));

  router.post('/users/:id/deactivate', asyncWrapper(deactivateUser));
  router.post('/users/:id/activate', asyncWrapper(activateUser));

  router.get('/users/by-entra-oid/:entraOid', asyncWrapper(findByEntraOid));
  router.post('/users/:uid/link-entra-oid', asyncWrapper(linkDsiUserWithEntra));

  return router;
};

module.exports = routeExport();

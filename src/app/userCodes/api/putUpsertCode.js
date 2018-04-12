'use strict';

const logger = require('./../../../infrastructure/logger');
const storage = require('./../data');
const NotificatonClient = require('login.dfe.notifications.client');
const userAdapter = require('./../../user/adapter');
const config = require('./../../../infrastructure/config');
const uuid = require('uuid/v4');

const sendNotification = async (user, codeType, code, req, uid) => {
  const client = new NotificatonClient({
    connectionString: config.notifications.connectionString,
  });

  if (codeType.toLowerCase() === 'passwordreset') {
    return client.sendPasswordReset(user.email, code.code, req.body.clientId, uid);
  }

  if (codeType.toLowerCase() === 'confirmmigratedemail') {
    return client.sendConfirmMigratedEmail(code.email, code.code, req.body.clientId, code.uid);
  }

  if (codeType.toLowerCase() === 'changeemail') {
    return client.sendVerifyChangeEmail(code.email, user.given_name, user.family_name, code.code);
  }

  return Promise.resolve();
};

const put = async (req, res) => {
  try {
    if ((!req.body.uid && !req.body.email) || !req.body.clientId || !req.body.redirectUri) {
      res.status(400).contentType('json').send(JSON.stringify({
        message: 'You must provide uid, clientId and redirectUri',
        uid: req.body.uid ? req.body.uid : 'NOT SUPPLIED',
        clientId: req.body.clientId ? req.body.clientId : 'NOT SUPPLIED',
        redirectUri: req.body.redirectUri ? req.body.redirectUri : 'NOT SUPPLIED',
      }));
      return;
    }
    let uid = req.body.uid;

    let codeType = 'PasswordReset';
    if (req.body.codeType) {
      codeType = req.body.codeType;
    }

    let code = await storage.getUserCode(uid, codeType, req.header('x-correlation-id'));
    if (!code && req.body.email) {
      code = await storage.getUserCodeByEmail(req.body.email, codeType, req.header('x-correlation-id'));
    }

    if (!code) {
      if (!uid) {
        uid = uuid();
      }
      code = await storage.createUserCode(uid, req.body.clientId, req.body.redirectUri, req.body.email, req.body.contextData, codeType, req.header('x-correlation-id'));
    }

    const user = await userAdapter.find(uid, req.header('x-correlation-id'));

    await sendNotification(user, codeType, code, req, uid);

    res.send(code);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = put;

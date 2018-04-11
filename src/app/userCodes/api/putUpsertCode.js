'use strict';

const logger = require('./../../../infrastructure/logger');
const storage = require('./../data');
const NotificatonClient = require('login.dfe.notifications.client');
const userAdapter = require('./../../user/adapter');
const config = require('./../../../infrastructure/config');

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
    const uid = req.body.uid;

    let codeType = 'PasswordReset';
    if (req.body.codeType) {
      codeType = req.body.codeType;
    }

    let code = await storage.getUserCode(uid, codeType, req.header('x-correlation-id'));
    if (!code && req.body.email) {
      code = await storage.getUserCodeByEmail(req.body.email, codeType, req.header('x-correlation-id'));
    }

    if (!code) {
      code = await storage.createUserCode(uid, req.body.clientId, req.body.redirectUri, req.body.email, req.body.contextData, codeType, req.header('x-correlation-id'));
    }

    const client = new NotificatonClient({
      connectionString: config.notifications.connectionString,
    });

    const user = await userAdapter.find(uid, req.header('x-correlation-id'));

    if (!req.body.type) {
      await client.sendPasswordReset(user.email, code.code, req.body.clientId, uid);
    } else if (req.body.type === 'migrate-email') {
      // await client.sendUserMigration(req.body.email, code.code, req.body.clientId, uid);
    }

    res.send(code);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = put;

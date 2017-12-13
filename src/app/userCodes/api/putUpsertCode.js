'use strict';

const logger = require('./../../../infrastructure/logger');
const storage = require('./../data/redisUserCodeStorage');
const NotificatonClient = require('login.dfe.notifications.client');
const userAdapter = require('./../../user/adapter');
const config = require('./../../../infrastructure/config');

const put = async (req, res) => {

  try {
    if (!req.body.uid || !req.body.clientId || !req.body.redirectUri) {
      res.status(400).contentType('json').send(JSON.stringify({
        message: 'You must provide uid, clientId and redirectUri',
        uid: req.body.uid ? req.body.uid : 'NOT SUPPLIED',
        clientId: req.body.clientId ? req.body.clientId : 'NOT SUPPLIED',
        redirectUri: req.body.redirectUri ? req.body.redirectUri : 'NOT SUPPLIED',
      }));
      return;
    }
    const uid = req.body.uid;

    let code = await storage.getUserPasswordResetCode(uid);

    if (!code) {
      code = await storage.createUserPasswordResetCode(uid, req.body.clientId, req.body.redirectUri);
    }

    const client = new NotificatonClient({
      connectionString: config.notifications.connectionString,
    });

    const user = await userAdapter.find(uid);

    await client.sendPasswordReset(user.email, code.code, req.body.clientId);

    res.send(code);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = put;

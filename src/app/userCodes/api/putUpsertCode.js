'use strict';
const logger = require('./../../../infrastructure/logger');
const redisUserCodeStorage = require('./../data/redisUserCodeStorage');
const NotificatonClient = require('login.dfe.notifications.client');
const userAdapter = require('./../../user/adapter');
const config = require('./../../../infrastructure/config')();

const put = async (req,res) => {

  try{
    if(!req.body.uid || !req.body.clientId) {
      res.status(400).send();
      return;
    }
    const uid = req.body.uid;
    const storage = new redisUserCodeStorage();

    let code = await storage.getUserPasswordResetCode(uid);

    if(!code){
      code = await storage.createUserPasswordResetCode(uid, req.body.clientId);
      storage.close();
    }

    const client = new NotificatonClient({
      connectionString: config.notifications.connectionString
    });

    const user = await userAdapter.find(uid);

    await client.sendPasswordReset(user.email, code.code)

    res.send(code);
  }catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = put;

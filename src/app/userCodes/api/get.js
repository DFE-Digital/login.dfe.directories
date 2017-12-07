'use strict';

const logger = require('./../../../infrastructure/logger');
const RedisUserCodeStorage = require('./../data/redisUserCodeStorage');

const get = async (req, res) => {
  try {
    if (!req.params.uid) {
      return res.status(400).send();
    }
    const uid = req.params.uid;
    const storage = new RedisUserCodeStorage();

    const code = await storage.getUserPasswordResetCode(uid);

    if (!code) {
      return res.status(404).send();
    }

    return res.status(200).send(code);
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = get;

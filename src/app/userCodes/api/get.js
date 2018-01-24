'use strict';

const logger = require('./../../../infrastructure/logger');
const storage = require('./../data');

const get = async (req, res) => {
  try {
    if (!req.params.uid) {
      return res.status(400).send();
    }
    const uid = req.params.uid;

    const code = await storage.getUserPasswordResetCode(uid, req.header('x-correlation-id'));

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

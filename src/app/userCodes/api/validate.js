'use strict';

const logger = require('./../../../infrastructure/logger');
const storage = require('./../data');

const validate = async (req, res) => {
  try {
    if (!req.params.uid || !req.params.code) {
      res.status(400).send();
      return;
    }
    const uid = req.params.uid;

    let codeType = 'PasswordReset';
    if (req.params.codeType) {
      codeType = req.params.codeType;
    }

    const code = await storage.getUserCode(uid, codeType, req.header('x-correlation-id'));

    if (!code) {
      res.status(404).send();
      return;
    }

    if (code.code.toLowerCase() === req.params.code.toLowerCase()) {
      res.status(200).send(code);
      return;
    }
    res.status(404).send();
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = validate;

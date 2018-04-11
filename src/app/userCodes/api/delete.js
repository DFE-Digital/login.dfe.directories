'use strict';

const storage = require('./../data');
const logger = require('./../../../infrastructure/logger');

const deleteCode = async (req, res) => {
  try {
    if (!req.params.uid) {
      res.status(400).send();
      return;
    }
    const uid = req.params.uid;

    let codeType = 'PasswordReset';
    if (req.params.codeType) {
      codeType = req.params.codeType;
    }

    const code = await storage.deleteUserCode(uid, codeType, req.header('x-correlation-id'));
    res.status(200).send(code);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = deleteCode;

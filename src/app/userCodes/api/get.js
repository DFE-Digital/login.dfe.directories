"use strict";

const logger = require("./../../../infrastructure/logger");
const storage = require("./../data");

const isUuid = (value) =>
  value.match(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/);

const get = async (req, res) => {
  try {
    if (!req.params.uid) {
      return res.status(400).send();
    }
    const uid = req.params.uid.toLowerCase();

    let codeType = "PasswordReset";
    if (req.params.codeType) {
      codeType = req.params.codeType;
    }
    let code;
    if (isUuid(uid)) {
      code = await storage.getUserCode(
        uid,
        codeType,
        req.header("x-correlation-id"),
      );
    }
    if (!code) {
      code = await storage.getUserCodeByEmail(
        uid,
        codeType,
        req.header("x-correlation-id"),
      );
    }

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

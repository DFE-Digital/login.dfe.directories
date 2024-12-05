"use strict";

const { NotificationClient } = require("login.dfe.jobs-client");
const { v4: uuid } = require("uuid");
const logger = require("../../../infrastructure/logger");
const storage = require("../data");
const userAdapter = require("../../user/adapter");
const config = require("../../../infrastructure/config");

const sendNotification = async (user, code, req, uid) => {
  const client = new NotificationClient({
    connectionString: config.notifications.connectionString,
  });

  if (!code || !user) {
    return Promise.reject("user code or user object is null");
  }

  if (code.codeType.toLowerCase() === "passwordreset") {
    return client.sendPasswordReset(
      user.email,
      user.given_name,
      user.family_name,
      code.code,
      req.body.clientId,
      uid,
    );
  }

  if (code.codeType.toLowerCase() === "changeemail") {
    const emailUid = req.body.selfInvoked ? undefined : uid;
    await client.sendVerifyChangeEmail(
      code.email,
      user.given_name,
      user.family_name,
      code.code,
      emailUid,
    );
    return client.sendNotifyMigratedEmail(
      user.email,
      user.given_name,
      user.family_name,
      code.email,
    );
  }

  return Promise.resolve();
};

const put = async (req, res) => {
  try {
    if (
      (!req.body.uid && !req.body.email) ||
      !req.body.clientId ||
      !req.body.redirectUri
    ) {
      res
        .status(400)
        .contentType("json")
        .send(
          JSON.stringify({
            message: "You must provide uid, clientId and redirectUri",
            uid: req.body.uid ? req.body.uid : "NOT SUPPLIED",
            clientId: req.body.clientId ? req.body.clientId : "NOT SUPPLIED",
            redirectUri: req.body.redirectUri
              ? req.body.redirectUri
              : "NOT SUPPLIED",
          }),
        );
      return;
    }
    let { uid } = req.body;

    let codeType = "PasswordReset";
    if (req.body.codeType) {
      codeType = req.body.codeType;
    }

    let code = await storage.getUserCode(
      uid,
      codeType,
      req.header("x-correlation-id"),
    );
    if (!code && req.body.email) {
      code = await storage.getUserCodeByEmail(
        req.body.email,
        codeType,
        req.header("x-correlation-id"),
      );
    }

    if (!uid) {
      uid = uuid();
    }

    if (!code) {
      code = await storage.createUserCode(
        uid,
        req.body.clientId,
        req.body.redirectUri,
        req.body.email,
        req.body.contextData,
        codeType,
        req.header("x-correlation-id"),
      );
    } else {
      uid = code.uid;
      code = await storage.updateUserCode(
        uid,
        req.body.email,
        req.body.contextData,
        req.body.redirectUri,
        req.body.clientId,
        codeType,
        req.header("x-correlation-id"),
      );
    }

    const user = await userAdapter.find(uid, req.header("x-correlation-id"));

    logger.audit({
      type: "change-email",
      subType: "verification-code",
      application: config.loggerSettings.applicationName,
      env: config.hostingEnvironment.env,
      userId: uid,
      message: `Change email verification code ${code.code} sent to email ${code.email}. code expiry=${code.createdAt}, code type=${code.codeType.toLowerCase()}`,
    });

    await sendNotification(user, code, req, uid);

    res.send(code);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = put;

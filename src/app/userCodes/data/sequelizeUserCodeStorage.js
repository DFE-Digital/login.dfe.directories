'use strict';

const logger = require('./../../../infrastructure/logger');
const { userCode } = require('./../../../infrastructure/repository');
const generateResetCode = require('./../utils/generateResetCode');


const getUserPasswordResetCode = async (uid, correlationId) => {
  try {
    logger.info(`Find User Password Reset Code for request: ${correlationId}`, { correlationId });
    return await userCode.findById(uid);
  } catch (e) {
    logger.error(`Create User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const createUserPasswordResetCode = async (uid, clientId, redirectUri, correlationId) => {
  try {
    logger.info(`Create User Password Reset Code for request: ${correlationId}`, { correlationId });

    if (!uid || !clientId || !redirectUri) {
      return null;
    }

    const code = generateResetCode();
    const userResetCode = {
      uid,
      code,
      clientId,
      redirectUri,
    };

    await userCode.create(userResetCode);

    return userResetCode;
  } catch (e) {
    logger.error(`Create User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const deleteUserPasswordResetCode = async (uid, correlationId) => {
  try {
    logger.info(`Delete User Password Reset Code for request: ${correlationId}`, { correlationId });
    if (!uid) {
      return;
    }
    await userCode.deleteById(uid);
  } catch (e) {
    logger.error(`Delete User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

module.exports = {
  getUserPasswordResetCode,
  createUserPasswordResetCode,
  deleteUserPasswordResetCode,
};

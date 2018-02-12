'use strict';

const Redis = require('ioredis');
const config = require('./../../../infrastructure/config');
const resetCode = require('./../utils/generateResetCode');
const logger = require('./../../../infrastructure/logger');

const tls = config.userCodes.params.redisUrl.includes('6380');
const client = new Redis(config.userCodes.params.redisUrl, { tls });

const find = async (uid) => {
  const result = await client.get(`UserResetCode_${uid}`);
  if (!result) {
    return null;
  }
  const userCode = JSON.parse(result);
  return userCode || null;
};

const createCode = async (uid, clientId, redirectUri) => {
  if (!uid || !clientId || !redirectUri) {
    return null;
  }

  const code = resetCode();
  const userResetCode = {
    uid,
    code,
    clientId,
    redirectUri,
  };
  const content = JSON.stringify(userResetCode);

  await client.set(`UserResetCode_${uid}`, content);
  return userResetCode;
};

const deleteCode = async (uid) => {
  if (!uid) {
    return;
  }
  await client.del(`UserResetCode_${uid}`);
};


const getUserPasswordResetCode = async (uid, correlationId) => {
  try {
    logger.info(`Find User Password Reset Code for request: ${correlationId}`, { correlationId });
    return await find(uid);
  } catch (e) {
    logger.error(`Create User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const createUserPasswordResetCode = async (uid, clientId, redirectUri, correlationId) => {
  try {
    logger.info(`Create User Password Reset Code for request: ${correlationId}`, { correlationId });
    return await createCode(uid, clientId, redirectUri);
  } catch (e) {
    logger.error(`Create User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const deleteUserPasswordResetCode = async (uid, correlationId) => {
  try {
    logger.info(`Delete User Password Reset Code for request: ${correlationId}`, { correlationId });
    return await deleteCode(uid);
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

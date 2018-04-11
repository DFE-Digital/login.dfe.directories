'use strict';

const Redis = require('ioredis');
const config = require('./../../../infrastructure/config');
const resetCode = require('./../utils/generateResetCode');
const logger = require('./../../../infrastructure/logger');

const tls = config.userCodes.params.redisUrl.includes('6380');
const client = new Redis(config.userCodes.params.redisUrl, { tls });

const find = async (uid, codeType) => {
  const result = await client.get(`UserResetCode_${uid.toLowerCase()}_${codeType.toLowerCase()}`);
  if (!result) {
    return null;
  }
  const userCode = JSON.parse(result);
  return userCode || null;
};

const createCode = async (uid, clientId, redirectUri, email, contextData, codeType) => {
  if (!uid || !clientId || !redirectUri) {
    return null;
  }

  const code = resetCode();
  const userResetCode = {
    uid,
    code,
    clientId,
    redirectUri,
    email,
    contextData,
    codeType,
  };
  const content = JSON.stringify(userResetCode);

  await client.set(`UserResetCode_${uid.toLowerCase()}_${codeType.toLowerCase()}`, content);
  return userResetCode;
};

const deleteCode = async (uid, codeType) => {
  if (!uid) {
    return;
  }
  await client.del(`UserResetCode_${uid.toLowerCase()}_${codeType.toLowerCase()}`);
};


const getUserCode = async (uid, codeType, correlationId) => {
  try {
    logger.info(`Find User Password Reset Code for request: ${correlationId}`, { correlationId });
    return await find(uid, codeType);
  } catch (e) {
    logger.error(`Create User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const getUserCodeByEmail = async (email, codeType, correlationId) => {
  try {
    logger.info(`Find User Password Reset Code by email for request: ${correlationId}`, { correlationId });
    return await find(email, codeType);
  } catch (e) {
    logger.error(`Create User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};


const createUserCode = async (uid, clientId, redirectUri, email, contextData, codeType, correlationId) => {
  try {
    logger.info(`Create User Password Reset Code for request: ${correlationId}`, { correlationId });
    return await createCode(uid, clientId, redirectUri, email, contextData, codeType);
  } catch (e) {
    logger.error(`Create User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const deleteUserCode = async (uid, codeType, correlationId) => {
  try {
    logger.info(`Delete User Password Reset Code for request: ${correlationId}`, { correlationId });
    return await deleteCode(uid, codeType);
  } catch (e) {
    logger.error(`Delete User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};


module.exports = {
  getUserCode,
  getUserCodeByEmail,
  createUserCode,
  deleteUserCode,
};

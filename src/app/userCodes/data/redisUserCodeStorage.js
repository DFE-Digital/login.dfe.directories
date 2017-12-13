'use strict';

const Redis = require('ioredis');
const config = require('./../../../infrastructure/config');
const resetCode = require('./../utils/generateResetCode');
const logger = require('./../../../infrastructure/logger');

const client = new Redis(config.userCodes.redisUrl);

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

  const code = config.userCodes.staticCode ? 'ABC123' : resetCode();
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


const getUserPasswordResetCode = async (uid) => {
  try {
    return await find(uid);
  } catch (e) {
    logger.error(e);
    throw e;
  }
};

const createUserPasswordResetCode = async (uid, clientId, redirectUri) => {
  try {
    return await createCode(uid, clientId, redirectUri);
  } catch (e) {
    logger.error(e);
    throw e;
  }
};

const deleteUserPasswordResetCode = async (uid) => {
  try {
    return await deleteCode(uid);
  } catch (e) {
    logger.error(e);
    throw e;
  }
};


module.exports = {
  getUserPasswordResetCode,
  createUserPasswordResetCode,
  deleteUserPasswordResetCode,
};

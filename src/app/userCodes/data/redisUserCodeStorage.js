'use strict';

const Redis = require('ioredis');
const config = require('./../../../infrastructure/config');
const resetCode = require('./../utils/generateResetCode');
const logger = require('./../../../infrastructure/logger');

const find = async (uid, client) => {
  const result = await client.get(`UserResetCode_${uid}`);
  if (!result) {
    return null;
  }
  const userCode = JSON.parse(result);
  return userCode || null;
};

const createCode = async (uid, clientId, redirectUri, client) => {
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

const deleteCode = async (uid, client) => {
  if (!uid) {
    return;
  }
  await client.del(`UserResetCode_${uid}`);
};

class RedisUserCodeStorage {
  constructor(redisClient) {
    if (redisClient === null || redisClient === undefined) {
      this.client = new Redis(config.userCodes.redisUrl);
    } else {
      this.client = redisClient;
    }
  }

  async getUserPasswordResetCode(uid) {
    try {
      return await find(uid, this.client);
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

  async createUserPasswordResetCode(uid, clientId, redirectUri) {
    try {
      return await createCode(uid, clientId, redirectUri, this.client);
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

  async deleteUserPasswordResetCode(uid) {
    try {
      return await deleteCode(uid, this.client);
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }
}

module.exports = RedisUserCodeStorage;

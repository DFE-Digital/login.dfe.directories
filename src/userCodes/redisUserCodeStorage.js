'use strict';

const Redis = require('ioredis');
const config = require('./../config');
const resetCode = require('./generateResetCode');

let redisClient;

const find = async (uid, client) => {
  const result = await client.get(`UserResetCode_${uid}`);
  if (!result) {
    return null;
  }
  const userCode = JSON.parse(result);
  return userCode || null;
};

const createCode = async (uid, clientId, client) => {
  if (!uid || !clientId) {
    return (null);
  }
  const code = config.userCodes.staticCode ? 'ABC123' : resetCode();
  const userResetCode = {
    uid,
    code,
    clientId,
  };
  const content = JSON.stringify(userResetCode);

  await client.set(`UserResetCode_${uid}`, content);
  return userResetCode;
};

const deleteCode = async (uid, client) => {
  if (!uid) {
    return null;
  }
  await client.del(`UserResetCode_${uid}`);
};

class RedisUserCodeStorage {
  constructor(client) {
    if (!client) {
      if (!redisClient) {
        redisClient = new Redis(config.adapter.params.redisurl);
      }
    } else {
      redisClient = client;
    }
  }

  async getUserPasswordResetCode(uid) {
    try {
      return await find(uid, redisClient);
    } catch (e) {
      throw e;
    }
  }

  async createUserPasswordResetCode(uid, clientId) {
    try {
      return await createCode(uid, clientId, redisClient);
    } catch (e) {
      throw e;
    }
  }

  async deleteUserPasswordResetCode(uid) {
    try {
      return await deleteCode(uid, redisClient);
    } catch (e) {
      throw e;
    }
  }
}
module.exports = RedisUserCodeStorage;


'use strict';

const Redis = require('ioredis');
const config = require('./../../../infrastructure/config')();
const resetCode = require('./../utils/generateResetCode');
const logger = require('./../../../infrastructure/logger');
const staticUserCode = 'ABC123';

const find = async (uid, client) => {
  const result = await client.get(`UserResetCode_${uid}`);
  if (!result) {
    return null;
  }
  const userCode = JSON.parse(result);
  return userCode || null;
};

const createCode = async (uid, clientId, client) => {
  if(!uid || !clientId){
    return null;
  }

  let code = config.userCodes.staticCode ? staticUserCode : resetCode();
  let userResetCode = {
    uid : uid,
    code : code,
    clientId: clientId
  };
  const content = JSON.stringify(userResetCode);

  await client.set(`UserResetCode_${uid}`,content);
  return userResetCode;
};

const deleteCode = async (uid, client) => {
  if(!uid){
    return null;
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
      return await find(uid,this.client);
    } catch(e) {
      logger.error(e);
    }
  }

  async createUserPasswordResetCode(uid, clientId) {
    try {
      return await createCode(uid,clientId, this.client);
    } catch(e){
      logger.error(e);
    }
  }

  async deleteUserPasswordResetCode(uid) {
    try {
      return await deleteCode(uid, this.client);
    } catch(e) {
      logger.error(e);
    }
  }
}
module.exports = RedisUserCodeStorage;
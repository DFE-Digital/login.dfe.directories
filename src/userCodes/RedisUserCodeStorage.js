'use strict'

const redis = require('ioredis');
const config = require('./../config');
let client;

class RedisUserCodeStorage {
  constructor(redisClient){
    if(redisClient === null || redisClient === undefined){
      client = new redis(config.usercodes.redis.url);
    } else{
      client = redisClient;
    }
  }

  close() {
    try{
      client.disconnect();
    }catch(e){
      console.log(e)
    }
  }

  async GetUserPasswordResetCode(uid) {
    return new Promise((resolve) => {
      client.get(`UserResetCode_${uid}`).then((result) => {
        if(result === null || result === undefined){
          resolve(null);
        }

        const userCode = JSON.parse(result);
        if (userCode === null || userCode === undefined) {
          resolve(null);
        } else {
          resolve(userCode === undefined ? null : userCode);
        }
      }).then(() => {
        this.close();
      });
    });
  }

}
module.exports = RedisUserCodeStorage;
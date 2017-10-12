'use strict'

const redis = require('ioredis');
const config = require('./../config');
const resetCode = require('./generateCode');
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

  async getUserPasswordResetCode(uid) {
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

  async createUserPasswordResetCode(uid) {
    return new Promise((resolve) => {
      if(uid === null || uid === undefined){
        resolve(null);
      }
      let code = resetCode();
      let userResetCode = {
        uid : uid,
        code : code
      };
      const content = JSON.stringify(userResetCode)

      client.set(`UserResetCode_${uid}`,content).then(() => {
        this.close();
        resolve(userResetCode)
      });
    });
  }

  async deleteUserPasswordResetCode(uid) {
    return new Promise((resolve)=>{
      if(uid === null || uid === undefined){
        resolve(null);
      }
      client.del(`UserResetCode_${uid}`).then(()=>{
        this.close();
        resolve(uid);
      });
    });
  }
}
module.exports = RedisUserCodeStorage;
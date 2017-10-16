'use strict'

const redis = require('ioredis');
const config = require('./../config');
const resetCode = require('./generateResetCode');
let client;

class RedisUserCodeStorage {
  constructor(redisClient){
    if(!redisClient){
      client = new redis(config.userCodes.redisUrl);
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
        if(!result){
          resolve(null);
        }

        const userCode = JSON.parse(result);
        if (userCode === null || userCode === undefined) {
          resolve(null);
        } else {
          resolve(userCode === undefined ? null : userCode);
        }
      });
    });
  }

  async createUserPasswordResetCode(uid) {
    return new Promise((resolve) => {
      if(!uid){
        resolve(null);
      }
      let code = resetCode();
      let userResetCode = {
        uid : uid,
        code : code
      };
      const content = JSON.stringify(userResetCode)

      client.set(`UserResetCode_${uid}`,content).then(() => {
        resolve(userResetCode)
      });
    });
  }

  async deleteUserPasswordResetCode(uid) {
    return new Promise((resolve)=>{
      if(!uid){
        resolve(null);
      }
      client.del(`UserResetCode_${uid}`).then(()=>{
        this.close();
        resolve();
      });
    });
  }
}
module.exports = RedisUserCodeStorage;
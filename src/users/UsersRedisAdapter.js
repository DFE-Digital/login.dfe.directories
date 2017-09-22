'use strict';

const UsersAdapter = require('./UsersAdapter');
const redis = require('ioredis');
const config = require('./../config');

let client;

class UsersRedisAdapter extends UsersAdapter{
  constructor(redisClient){
    super();
    if(redisClient === null || redisClient === undefined){
      client = new redis(config.redisurl);
    } else{
      client = redisClient;
    }
  }

  async find(id) {

    return new Promise((resolve, reject) => {
      client.get('Users').then((result) => {
        if(result === null || result === undefined){
          resolve(null);
        }
        const users = JSON.parse(result);

        if(users === null || users === undefined){
          resolve(null);
        }else{
          const user = users.find((item) => item.id === id);

          resolve(user === undefined ? null : user);
        }


      });
    });
  }

}

module.exports = UsersRedisAdapter;
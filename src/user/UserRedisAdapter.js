'use strict';

const UserAdapter = require('./UserAdapter');
const redis = require('ioredis');

let client;
let configuration;

class UserRedisAdapter extends UserAdapter {
  constructor(redisClient, config) {
    super();
    configuration = config;
    if (redisClient === null || redisClient === undefined) {
      client = new redis(configuration.redisurl);
    } else {
      client = redisClient;
    }
  }

  async find(id) {
    return new Promise((resolve, reject) => {
      client.get('Users').then((result) => {
        if (result === null || result === undefined) {
          resolve(null);
        }
        const users = JSON.parse(result);

        if (users === null || users === undefined) {
          resolve(null);
        } else {
          const user = users.find((item) => item.sub === id);

          resolve(user === undefined ? null : user);
        }
      }).then(()=> {
        client.disconnect();
      });
    });
  }

  async findByUsername(username) {
    return new Promise((resolve, reject) => {
      client.get('Users').then((result) => {
        if (result === null || result === undefined) {
          resolve(null);
        }
        const users = JSON.parse(result);

        if (users === null || users === undefined) {
          resolve(null);
        } else {
          const user = users.find((item) => item.email === username);

          resolve(user === undefined ? null : user);
        }
      }).then(()=> {
        client.disconnect();
      });
    });
  }

}

module.exports = UserRedisAdapter;
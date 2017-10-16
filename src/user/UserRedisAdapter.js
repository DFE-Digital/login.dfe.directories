'use strict';

const UserAdapter = require('./UserAdapter');
const redis = require('ioredis');
const crypto = require('crypto');
const {promisify} = require('util');
const generateSalt = require('./generateSalt');

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
      client.get(`User_${id}`).then((result) => {
        if (result === null || result === undefined) {
          resolve(null);
        }
        const user = JSON.parse(result);

        resolve(user === undefined ? null : user);

      }).then(() => {
        try {
          client.disconnect();
        } catch (e) {
        }
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
          const userRef = users.find(item => item.email === username);
          const user = this.find(userRef.sub);
          resolve(user === undefined ? null : user);
        }
      }).then(() => {
        try {
          client.disconnect();
        } catch (e) {
        }
      });
    });
  }

  async changePassword(uid, newPassword) {

    return new Promise((resolve) => {
      client.get(`User_${uid}`).then((result) => {
          if (result === null || result === undefined) {
            resolve(false);
          }
          const user = JSON.parse(result);

          if (!user) {
            resolve(false);
          } else {

            const salt = generateSalt();
            crypto.pbkdf2(newPassword, salt, 10000, 512, 'sha512', (err, result) => {
              user.salt = salt;
              user.password = result.toString('base64');

              client.set(`User_${uid}`,JSON.stringify(user)).then(() => {
                resolve(true);
              });

            });
          }
        }
      );
    });

  }
}

module.exports = UserRedisAdapter;

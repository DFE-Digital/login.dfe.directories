'use strict';

const UserAdapter = require('./UserAdapter');
const Redis = require('ioredis');
const crypto = require('crypto');
const generateSalt = require('./generateSalt');

let redisCclient;

const find = async (id, client) => {
  const result = await client.get(`User_${id}`);
  if (!result) {
    return null;
  }
  const user = JSON.parse(result);
  return user || null;
};

const findByUsername = async (username, client) => {
  const result = await client.get('Users');
  if (!result) {
    return null;
  }

  const users = JSON.parse(result);
  if (!users) {
    return null;
  }

  const userRef = users.find(item => item.email === username);
  const user = await find(userRef.sub, client);
  return user || null;
};

const changePassword = async (uid, newPassword, client) => {
  const result = await client.get(`User_${uid}`);
  if (!result) {
    return false;
  }
  const user = JSON.parse(result);
  if (!user) {
    return false;
  }

  const salt = generateSalt();
  const password = crypto.pbkdf2Sync(newPassword, salt, 10000, 512, 'sha512');

  user.salt = salt;
  user.password = password.toString('base64');

  return !!client.set(`User_${uid}`, JSON.stringify(user));
};

class UserRedisAdapter extends UserAdapter {
  constructor(client, config) {
    super();

    if (!client) {
      if (!redisCclient) {
        redisCclient = new Redis(config.redisurl);
      }
    } else {
      redisCclient = client;
    }
  }

  async find(id) {
    try {
      return await find(id, redisCclient);
    } catch (e) {
      this.client.disconnect();
      throw (e);
    }
  }

  async findByUsername(username) {
    try {
      return await findByUsername(username, redisCclient);
    } catch (e) {
      this.client.disconnect();
      throw (e);
    }
  }

  async changePassword(uid, newPassword) {
    try {
      return await changePassword(uid, newPassword, redisCclient);
    } catch (e) {
      this.client.disconnect();
      throw (e);
    }
  }
}

module.exports = UserRedisAdapter;

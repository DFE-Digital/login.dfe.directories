'use strict';

const UserAdapter = require('./UserAdapter');
const Redis = require('ioredis');
const crypto = require('crypto');
const generateSalt = require('./generateSalt');

class UserRedisAdapter extends UserAdapter {
  constructor(redisClient, config) {
    super();
    this.configuration = config;
    if (redisClient === null || redisClient === undefined) {
      this.client = new Redis(this.configuration.redisurl);
    } else {
      this.client = redisClient;
    }
  }

  async find(id) {
    try {
      return this._find(id, this.client);
    } finally {
      this.client.disconnect();
    }
  }

  async findByUsername(username) {
    try {
      return this._findByUsername(username, this.client);
    } finally {
      this.client.disconnect();
    }
  }

  async changePassword(uid, newPassword) {
    try {
      return this._changePassword(uid, newPassword, this.client);
    } finally {
      this.client.disconnect();
    }
  }

  // Private methods

  async _find(id, client) {
    const result = await client.get(`User_${id}`);
    if (!result) {
      return null;
    }
    const user = JSON.parse(result);
    return user || null;
  }

  async _findByUsername(username, client) {
    const result = await client.get('Users');
    if (!result) {
      return null;
    }

    const users = JSON.parse(result);
    if (!users) {
      return null;
    }

    const userRef = users.find(async item => await item.email === username);
    const user = await this._find(userRef.sub, client);
    return user || null;
  }

  async _changePassword(uid, newPassword, client) {
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
  }
}

module.exports = UserRedisAdapter;

'use strict';

const crypto = require('crypto');
const { promisify } = require('util');

class UserAdapter {
  async find(id) {
    return Promise.resolve(null);
  }
  async findByUsername(username) {
    return Promise.resolve(null);
  }
  async list(page = 1, pageSize = 10) {
    return Promise.resolve([]);
  }

  async authenticate(username, password) {
    const user = await this.findByUsername(username);

    if (!user) return null;
    const request = promisify(crypto.pbkdf2);

    const saltBuffer = Buffer.from(user.salt, 'utf8');
    const derivedKey = await request(password, saltBuffer, 10000, 512, 'sha512');

    if (derivedKey.toString('base64') === user.password) {
      return user;
    }
    return null;
  }
  async changePassword(uid, newPassword){
    return Promise.resolve(null);
  }
}

module.exports = UserAdapter;

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

  async authenticate(username, password) {
    const user = await this.findByUsername(username);

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

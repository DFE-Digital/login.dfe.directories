'use strict';
const crypto = require('crypto');
const {promisify} = require('util');
const RequestVerification = require('login.dfe.request-verification');

let requestVerification;

class UserAdapter {
  constructor(){
    requestVerification = new RequestVerification();
  }
  async find(id) {
    return Promise.resolve({});
  }
  async authenticate(username, password) {
      const user = this.find(username);

      const request = promisify(crypto.pbkdf2);

      const derivedKey = request(password, user.salt, 10000, 512, 'sha512');

      if (derivedKey.toString('hex') === user.password) {
        return true;
      }

  }
}

module.exports = UserAdapter;
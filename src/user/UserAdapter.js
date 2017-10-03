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
  async authenticate(username, password, sig) {
    const contents = JSON.stringify({username: username, password: password});
    if (requestVerification.verifyRequest(contents, config.RequestVerificationCertification, sig)) {
      const user = this.find(username);

      const request = promisify(crypto.pbkdf2);

      const derivedKey = request(password, user.salt, 100000, 512, 'sha512');

      if (derivedKey.toString('hex') === user.password) {
        return true;
      }
    }
    return false;
  }
}

module.exports = UserAdapter;
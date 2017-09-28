const UserAdapter = require('./UserAdapter');
const ActiveDirectory = require('activedirectory');
const {promisify} = require('util');
const config = require('./../config')
const RequestVerification = require('login.dfe.request-verification');

let activeDirectory;
let requestVerification;

class UserAzureActiveDirectoryAdapter extends UserAdapter {
  constructor() {
    super();
    activeDirectory = new ActiveDirectory(config.ldapConfiguration);
    requestVerification = new RequestVerification();
  }

  async find(username) {
    const request = promisify(activeDirectory.userExists);

    return request(null, username);
  }

  authenticate(username, password, sig) {

    const contents = JSON.stringify({username: username, password: password});

    if (requestVerification.verifyRequest(contents, config.RequestVerificationCertification, sig)) {
      const request = promisify(activeDirectory.authenticate);
      return request(username, password);
    } else {
      return false;
    }
  }
}

module.exports = UserAzureActiveDirectoryAdapter;
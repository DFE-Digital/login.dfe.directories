const UserAdapter = require('./UserAdapter');
const ActiveDirectory = require('activedirectory');
const UserModel = require('./UserModel');


class UserAzureActiveDirectoryAdapter extends UserAdapter {
  constructor(config) {
    super();
    this.activeDirectory = new ActiveDirectory(config);
  }

  async find(id) {
    return new Promise((resolve, reject) => {
      this.activeDirectory.findUser(undefined, id, (err, user) => {
        if (err) {
          return reject(err);
        }

        const userModel = new UserModel();
        userModel.sub = user.dn;
        userModel.given_name = user.givenName;
        userModel.family_name = user.sn;
        userModel.email = user.userPrincipalName;
        return resolve(userModel);
      });
    });
  }
  async findByUsername(username) {
    return new Promise((resolve, reject) => {
      this.activeDirectory.findUser(undefined, username, (err, user) => {
        if (err) {
          return reject(err);
        }

        const userModel = new UserModel();
        userModel.sub = user.dn;
        userModel.given_name = user.givenName;
        userModel.family_name = user.sn;
        userModel.email = user.userPrincipalName;
        return resolve(userModel);
      });
    });
  }
  async list(page = 1, pageSize = 10) {
    throw new Error('List method is not implemented for AAD');
    error.type = 'E_NOTIMPLEMENTED';
    throw error;
  }

  authenticate(username, password) {
    return new Promise((resolve, reject) => {
      this.activeDirectory.authenticate(username, password, (err, result) => {
        if (err) {
          return reject(err);
        }
        if (!result) {
          return resolve(null);
        }

        this.findByUsername(username)
          .then((user) => {
            resolve(user);
          })
          .catch((err1) => {
            reject(err1);
          });
      });
    });
  }
}

module.exports = UserAzureActiveDirectoryAdapter;

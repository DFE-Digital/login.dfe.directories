const ActiveDirectory = require('activedirectory');
const UserModel = require('./UserModel');
const config = require('./../../../infrastructure/config');

const activeDirectory = new ActiveDirectory(config.adapter.params);


const find = async id => new Promise((resolve, reject) => {
  activeDirectory.findUser(undefined, id, (err, user) => {
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
const findByUsername = async username => new Promise((resolve, reject) => {
  activeDirectory.findUser(undefined, username, (err, user) => {
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
const list = async (page = 1, pageSize = 10) => {
  throw new Error('List method is not implemented for AAD');
  error.type = 'E_NOTIMPLEMENTED';
  throw error;
};

const authenticate = (username, password) => new Promise((resolve, reject) => {
  activeDirectory.authenticate(username, password, (err, result) => {
    if (err) {
      return reject(err);
    }
    if (!result) {
      return resolve(null);
    }

    findByUsername(username)
      .then((user) => {
        resolve(user);
      })
      .catch((err1) => {
        reject(err1);
      });
  });
});


module.exports = {
  authenticate,
  list,
  find,
  findByUsername,
};

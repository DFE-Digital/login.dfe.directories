const UserAdapter = require('./UserAdapter');
const ActiveDirectory = require('activedirectory');
const UserModel = require('./UserModel');

const RequestVerification = require('login.dfe.request-verification');

let activeDirectory;
let requestVerification;

class UserAzureActiveDirectoryAdapter extends UserAdapter {
  constructor(config) {
    super();
    activeDirectory = new ActiveDirectory(config.ldapConfiguration);
    requestVerification = new RequestVerification();
  }

  async find(username) {
    return new Promise((resolve, reject)=>{
      activeDirectory.findUser(undefined,username,(err, user) => {
        if(err){
          return reject(err);
        }

        var userModel = new UserModel();
        userModel.sub = user.sAMAccountName;
        userModel.given_name = user.givenName;
        userModel.family_name = user.sn;
        userModel.email = user.userPrincipalName;
        return resolve(userModel);
      });
    });

  }

  authenticate(username, password) {
    return new Promise((resolve,reject)=>{
      activeDirectory.authenticate(username, password ,(err,result)=>{
        if(err){
          return reject(err);
        }
        return resolve(result);
      });
    })

  }
}

module.exports = UserAzureActiveDirectoryAdapter;
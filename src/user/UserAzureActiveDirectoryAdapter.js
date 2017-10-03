const UserAdapter = require('./UserAdapter');
const ActiveDirectory = require('activedirectory');
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
    return new Promise((resolve, reject)=>{
      activeDirectory.findUser(undefined,username,(err, user) => {
        if(err){
          return reject(err);
        }
        return resolve(user);
      });
    });

  }

  authenticate(username, password, sig) {
    return new Promise((resolve,reject)=>{
      const contents = JSON.stringify({username: username, password: password});

      if (requestVerification.verifyRequest(contents, config.RequestVerificationCertification, sig)) {
        activeDirectory.authenticate(username, password ,(err,result)=>{
          if(err){
            return reject(err);
          }

          return resolve(result);

        });
      }
      return reject('Can not verify request');
    })

  }
}

module.exports = UserAzureActiveDirectoryAdapter;

'use strict';

const UserAdapter = require('./UserAdapter');
const file = require('fs');
const path = require('path');

class UserFileAdapter extends UserAdapter{
  async find(id) {

    const usersJson = file.readFileSync(path.resolve('app_data/users.json'), {encoding : 'utf8'});

    if(!usersJson){
      return null;
    }

    const users = JSON.parse(usersJson);


    const user = users.find((item) => item.sub === id);
    return user === undefined ? null : user;
  }

  async authenticate(username, password) {
    return Promise.resolve(true);
  }

}

module.exports = UserFileAdapter;
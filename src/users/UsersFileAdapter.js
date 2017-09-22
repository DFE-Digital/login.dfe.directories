
'use strict';

const UsersAdapter = require('./UsersAdapter');
const file = require('fs');
const path = require('path');

class UsersFileAdapter extends UsersAdapter{
  async find(id) {

    const usersJson = file.readFileSync(path.resolve('app_data/users.json'), {encoding : 'utf8'});

    if(!usersJson){
      return null;
    }

    const users = JSON.parse(usersJson);


    const user = users.find((item) => item.id === id);
    return user === undefined ? null : user;
  }

}

module.exports = UsersFileAdapter;
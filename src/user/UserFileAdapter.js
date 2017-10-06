'use strict';

const UserAdapter = require('./UserAdapter');
const file = require('fs');
const path = require('path');
const {promisify} = require('util');

class UserFileAdapter extends UserAdapter {
  async find(id) {
    const users = await _readAllUsers();
    if (!users) {
      return null;
    }

    const user = users.find((item) => item.sub === id);
    return user === undefined ? null : user;
  }

  async findByUsername(username) {
    const users = await _readAllUsers();
    if (!users) {
      return null;
    }

    const user = users.find((item) => item.email === username);
    return user === undefined ? null : user;
  }

}

module.exports = UserFileAdapter;


async function _readAllUsers() {
  const readFile = promisify(file.readFile);
  const usersJson = await readFile(path.resolve('app_data/users.json'), {encoding: 'utf8'});

  if (!usersJson) {
    return null;
  }

  return JSON.parse(usersJson);
}
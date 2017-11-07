'use strict';

const UserAdapter = require('./UserAdapter');
const file = require('fs');
const path = require('path');
const { promisify } = require('util');
var _ = require('lodash');


const readAllUsers = async () => {
  const readFile = promisify(file.readFile);
  const usersJson = await readFile(path.resolve('app_data/users.json'), { encoding: 'utf8' });

  if (!usersJson) {
    return null;
  }

  return JSON.parse(usersJson);
};
const userSortOrderComparison = (x, y) => {
  if (x.given_name < y.given_name) {
    return -1;
  }
  if (x.given_name > y.given_name) {
    return 1;
  }

  if (x.family_name < y.family_name) {
    return -1;
  }
  if (x.family_name > y.family_name) {
    return 1;
  }

  return 0;
};

class UserFileAdapter extends UserAdapter {
  async find(id) {
    const users = await readAllUsers();
    if (!users) {
      return null;
    }

    const user = users.find((item) => item.sub === id);
    return user === undefined ? null : user;
  }

  async findByUsername(username) {
    const users = await readAllUsers();
    if (!users) {
      return null;
    }

    const user = users.find((item) => item.email === username);
    return user === undefined ? null : user;
  }

  async list(page = 1, pageSize = 10) {
    const allUsers = (await readAllUsers()).sort(userSortOrderComparison);
    const pagesOfUsers = _.chunk(allUsers, pageSize);
    if (page > pagesOfUsers.length) {
      return null;
    }

    return {
      users: pagesOfUsers[page - 1],
      numberOfPages: pagesOfUsers.length,
    };
  }

}

module.exports = UserFileAdapter;


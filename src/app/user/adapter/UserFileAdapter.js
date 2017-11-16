/* eslint-disable object-curly-spacing */
'use strict';

const UserAdapter = require('./UserAdapter');
const file = require('fs');
const path = require('path');
const {promisify} = require('util');
const uuid = require('uuid');
const generateSalt = require('./../utils/generateSalt');
const crypto = require('crypto');
const {chunk} = require('lodash');


const readAllUsers = async () => {
  const readFile = promisify(file.readFile);
  const usersJson = await readFile(path.resolve('app_data/users.json'), {encoding: 'utf8'});

  if (!usersJson) {
    return null;
  }

  return JSON.parse(usersJson);
};

const writeAllUsers = async (users) => {
  const writeTo = path.resolve('app_data/users.json');

  const writeFile = promisify(file.writeFile);
  return writeFile(writeTo, JSON.stringify(users), {encoding: 'utf8'});
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

  async create(username, password, firstName, lastName) {
    const users = await readAllUsers();
    if (users.find(u => u.email.toLowerCase() === username.toLowerCase())) {
      const err = new Error('User already exists');
      err.code = 400;
      throw err;
    }

    const salt = generateSalt();
    const encryptedPassword = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('base64');
    const newUser = {sub: uuid.v4(), given_name: firstName, family_name: lastName, email: username, salt, encryptedPassword};
    users.push(newUser);
    return writeAllUsers(users);
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
    const pagesOfUsers = chunk(allUsers, pageSize);
    if (page > pagesOfUsers.length) {
      return null;
    }

    return {
      users: pagesOfUsers[page - 1],
      numberOfPages: pagesOfUsers.length
    };
  }

}

module.exports = UserFileAdapter;


/* eslint-disable object-curly-spacing */

'use strict';

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


const find = async (id) => {
  const users = await readAllUsers();
  if (!users) {
    return null;
  }

  const user = users.find(item => item.sub === id);
  return user === undefined ? null : user;
};

const create = async (username, password, firstName, lastName, legacyUsername) => {
  const users = await readAllUsers();
  if (users.find(u => u.email.toLowerCase() === username.toLowerCase())) {
    const err = new Error('User already exists');
    err.code = 400;
    throw err;
  }

  const salt = generateSalt();
  const encryptedPassword = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('base64');
  const newUser = {sub: uuid.v4(), given_name: firstName, family_name: lastName, email: username, salt, encryptedPassword, legacy_username: legacyUsername };
  users.push(newUser);
  return writeAllUsers(users);
};

const findByUsername = async (username) => {
  const users = await readAllUsers();
  if (!users) {
    return null;
  }

  const user = users.find(item => item.email === username);
  return user === undefined ? null : user;
};

const list = async (page = 1, pageSize = 10) => {
  const allUsers = (await readAllUsers()).sort(userSortOrderComparison);
  const pagesOfUsers = chunk(allUsers, pageSize);
  if (page > pagesOfUsers.length) {
    return null;
  }

  return {
    users: pagesOfUsers[page - 1],
    numberOfPages: pagesOfUsers.length,
  };
};

const authenticate = async (username, password) => {
  const user = await this.findByUsername(username);

  if (!user) return null;
  const request = promisify(crypto.pbkdf2);

  const saltBuffer = Buffer.from(user.salt, 'utf8');
  const derivedKey = await request(password, saltBuffer, 10000, 512, 'sha512');

  if (derivedKey.toString('base64') === user.password) {
    return user;
  }
  return null;
};

const update = async (uid, given_name, family_name, email, correlationId) => {
  throw new Error('Update method is not implemented for File');
  error.type = 'E_NOTIMPLEMENTED';
  throw error;
};

const findByLegacyUsername = async (username, correlationId) => {
  throw new Error('Find by legacy username is not implemented for File');
  error.type = 'E_NOTIMPLEMENTED';
  throw error;
};

const getLegacyUsernames = async (username, correlationId) => {
  throw new Error('Get legacy usernames is not implemented for File');
  error.type = 'E_NOTIMPLEMENTED';
  throw error;
};

module.exports = {
  list,
  findByUsername,
  create,
  find,
  authenticate,
  update,
  getLegacyUsernames,
};


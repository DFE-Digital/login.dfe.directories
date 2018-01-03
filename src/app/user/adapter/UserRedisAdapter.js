'use strict';

const Redis = require('ioredis');
const crypto = require('crypto');
const { promisify } = require('util');
const generateSalt = require('./../utils/generateSalt');
const { chunk } = require('lodash');
const uuid = require('uuid');
const config = require('./../../../infrastructure/config');
const logger = require('./../../../infrastructure/logger');

const client = new Redis(config.adapter.params.redisurl);

const findById = async (id) => {
  const result = await client.get(`User_${id}`);
  if (!result) {
    return null;
  }
  const user = JSON.parse(result);
  return user || null;
};

const findByEmail = async (email) => {
  const result = await client.get('Users');
  if (!result) {
    return null;
  }

  const users = JSON.parse(result);
  if (!users) {
    return null;
  }

  const userRef = users.find(item => item.email.toLowerCase() === email.toLowerCase());

  if (!userRef) {
    return null;
  }

  const user = await findById(userRef.sub);
  return user || null;
};

const findByUsername = async (username, correlationId) => {
  try {
    logger.info(`Get user by username for request: ${correlationId}`, { correlationId });
    return await findByEmail(username);
  } catch (e) {
    logger.error(`Get user by username failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const createUser = async (username, password, firstName, lastName, correlationId) => {
  logger.info(`Create user called for request ${correlationId}`, { correlationId });

  if (!username || !password) {
    return null;
  }

  const exists = await findByUsername(username);
  if (exists) {
    return exists;
  }

  const salt = generateSalt();
  const encryptedPassword = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('base64');
  const id = uuid.v4();

  const newUser = {
    id,
    sub: id,
    given_name: firstName,
    family_name: lastName,
    email: username,
    salt,
    password: encryptedPassword
  };

  const content = JSON.stringify(newUser);
  await client.set(`User_${id}`, content);

  let users = await client.get('Users');
  users = JSON.parse(users);
  users.push({ sub: id, email: username });
  await client.set('Users', JSON.stringify(users));

  return newUser;
};

const getManyUsers = async (userIds) => {
  if (!userIds) {
    return null;
  }

  const userIdSearch = userIds.map(userId => `User_${userId}`);

  return client.mget(...userIdSearch).filter(user => !user === false).map(user => JSON.parse(user));
};

const changePasswordForUser = async (uid, newPassword) => {
  const result = await client.get(`User_${uid}`);
  if (!result) {
    return false;
  }
  const user = JSON.parse(result);
  if (!user) {
    return false;
  }

  const salt = generateSalt();
  const password = crypto.pbkdf2Sync(newPassword, salt, 10000, 512, 'sha512');

  user.salt = salt;
  user.password = password.toString('base64');

  return !!client.set(`User_${uid}`, JSON.stringify(user));
};

const find = async (id, correlationId) => {
  try {
    logger.info(`Get user by id for request: ${correlationId}`, { correlationId });
    return await findById(id);
  } catch (e) {
    logger.error(`Get user by id failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const create = async (username, password, firstName, lastName, correlationId) => createUser(username, password, firstName, lastName, correlationId);


const list = async (page = 1, pageSize = 10, correlationId) => {
  logger.info(`Get user list for request: ${correlationId}`, { correlationId });
  const userList = await client.get('Users');
  if (!userList) {
    return null;
  }
  const orderedUserList = JSON.parse(userList).sort((x, y) => {
    if (x.email < y.email) {
      return -1;
    }
    if (x.email > y.email) {
      return 1;
    }
    return 0;
  });
  const pagesOfUsers = chunk(orderedUserList, pageSize);
  if (page > pagesOfUsers.length) {
    return null;
  }

  const users = await Promise.all(pagesOfUsers[page - 1].map(async item => find(item.sub)));
  return {
    users,
    numberOfPages: pagesOfUsers.length,
  };
};

const changePassword = async (uid, newPassword, correlationId) => {
  try {
    logger.info(`Change password for request: ${correlationId}`, { correlationId });
    return await changePasswordForUser(uid, newPassword);
  } catch (e) {
    logger.error(`Change password failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const getUsers = async (uids, correlationId) => {
  try {
    logger.info(`Get Users for request: ${correlationId}`, { correlationId });
    const users = await getManyUsers(uids);

    if (!users || users.length === 0) {
      return null;
    }
    return users;
  } catch (e) {
    logger.error(`GetUsers failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const authenticate = async (username, password, correlationId) => {
  logger.info(`Authenticate user for request: ${correlationId}`, { correlationId });
  const user = await findByUsername(username);

  if (!user) return null;
  const request = promisify(crypto.pbkdf2);

  const saltBuffer = Buffer.from(user.salt, 'utf8');
  const derivedKey = await request(password, saltBuffer, 10000, 512, 'sha512');

  if (derivedKey.toString('base64') === user.password) {
    return user;
  }
  return null;
};


module.exports = {
  getUsers,
  changePassword,
  list,
  findByUsername,
  create,
  find,
  authenticate,
};

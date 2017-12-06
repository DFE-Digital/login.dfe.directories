'use strict';

const UserAdapter = require('./UserAdapter');
const Redis = require('ioredis');
const crypto = require('crypto');
const generateSalt = require('./../utils/generateSalt');
const { chunk } = require('lodash');
const uuid = require('uuid');

let redisClient;

const find = async (id, client) => {
  const result = await client.get(`User_${id}`);
  if (!result) {
    return null;
  }
  const user = JSON.parse(result);
  return user || null;
};

const findByUsername = async (username, client) => {
  const result = await client.get('Users');
  if (!result) {
    return null;
  }

  const users = JSON.parse(result);
  if (!users) {
    return null;
  }

  const userRef = users.find(item => item.email.toLowerCase() === username.toLowerCase());

  if (!userRef) {
    return null;
  }

  const user = await find(userRef.sub, client);
  return user || null;
};

const createUser = async (username, password, firstName, lastName, client) => {
  if (!username || !password) {
    return null;
  }

  const exists = await findByUsername(username, client);
  if (exists) {
    return exists;
  }

  const salt = generateSalt();
  const encryptedPassword = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('base64');
  const id = uuid.v4();

  const newUser = { id, sub: id, given_name: firstName, family_name: lastName, email: username, salt, password: encryptedPassword };

  const content = JSON.stringify(newUser);
  await client.set(`User_${id}`, content);

  let users = await client.get('Users');
  users = JSON.parse(users);
  users.push({ sub: id, email: username });
  await client.set('Users', JSON.stringify(users));

  return newUser;
};

const getUsers = async (userIds, client) => {
  if (!userIds || !client) {
    return null;
  }

  const userIdSearch = userIds.map(userId => `User_${userId}`);

  return client.mget(...userIdSearch).filter(user => !user === false).map(user => JSON.parse(user));
};

const changePassword = async (uid, newPassword, client) => {
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

class UserRedisAdapter extends UserAdapter {
  constructor(client, config) {
    super();

    if (!client) {
      if (!redisClient) {
        redisClient = new Redis(config.redisurl);
      }
    } else {
      redisClient = client;
    }
  }

  async find(id) {
    try {
      return await find(id, redisClient);
    } catch (e) {
      throw (e);
    }
  }

  async create(username, password, firstName, lastName) {
    return createUser(username, password, firstName, lastName, redisClient);
  }

  async findByUsername(username) {
    try {
      return await findByUsername(username, redisClient);
    } catch (e) {
      throw (e);
    }
  }

  async list(page = 1, pageSize = 10) {
    const userList = await redisClient.get('Users');
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

    const users = await Promise.all(pagesOfUsers[page - 1].map(async item => find(item.sub, redisClient)));
    return {
      users,
      numberOfPages: pagesOfUsers.length,
    };
  }

  async changePassword(uid, newPassword) {
    try {
      return await changePassword(uid, newPassword, redisClient);
    } catch (e) {
      throw (e);
    }
  }

  async getUsers(uids) {
    try {
      const users = await getUsers(uids, redisClient);

      if (!users || users.length === 0) {
        return null;
      }
      return users;
    } catch (e) {
      throw (e);
    }
  }
}

module.exports = UserRedisAdapter;

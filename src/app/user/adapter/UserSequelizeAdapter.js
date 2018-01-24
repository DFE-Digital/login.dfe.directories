'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const { user } = require('./../../../infrastructure/repository');
const generateSalt = require('./../utils/generateSalt');
const uuid = require('uuid');
const { promisify } = require('util');
const crypto = require('crypto');

const find = async (id, correlationId) => {
  try {
    logger.info(`Get user for request ${correlationId}`, { correlationId });
    const userEntity = await user.find({
      where: {
        sub: {
          [Op.eq]: id,
        },
      },
    });
    if (!userEntity) {
      return null;
    }

    return userEntity;
  } catch (e) {
    logger.error(`error getting user id:${id} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const findByUsername = async (username, correlationId) => {
  try {
    logger.info(`Get user for request ${username}`, { correlationId });
    const userEntity = await user.find({
      where: {
        email: {
          [Op.eq]: username,
        },
      },
    });
    if (!userEntity) {
      return null;
    }

    return userEntity;
  } catch (e) {
    logger.error(`error getting user with username:${username} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const getUsers = async (uids, correlationId) => {
  try {
    logger.info(`Get Users for request: ${correlationId}`, { correlationId });

    const users = await user.findAll({
      where: {
        sub: {
          [Op.or]: uids,
        },
      },
    });

    if (!users || users.length === 0) {
      return null;
    }
    return users;
  } catch (e) {
    logger.error(`GetUsers failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const changePassword = async (uid, newPassword, correlationId) => {
  try {
    const userEntity = await find(uid, correlationId);

    if (!userEntity) {
      return null;
    }

    const salt = generateSalt();
    const password = crypto.pbkdf2Sync(newPassword, salt, 10000, 512, 'sha512');

    await userEntity.updateAttributes({
      salt,
      password: password.toString('base64'),
    });

    return userEntity;
  } catch (e) {
    logger.error(`GetUsers failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const changeStatus = async (uid, userStatus, correlationId) => {
  try {
    logger.info(`Change status for request: ${correlationId}`, { correlationId });
    const userEntity = await find(uid, correlationId);

    if (!userEntity) {
      return null;
    }

    await userEntity.updateAttributes({
      status: userStatus,
    });

    return userEntity;
  } catch (e) {
    logger.error(`Change user status failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const authenticate = async (username, password, correlationId) => {
  try {
    logger.info(`Authenticate user for request: ${correlationId}`, { correlationId });
    const userEntity = await findByUsername(username);

    if (!userEntity) return null;

    const request = promisify(crypto.pbkdf2);

    const saltBuffer = Buffer.from(userEntity.salt, 'utf8');
    const derivedKey = await request(password, saltBuffer, 10000, 512, 'sha512');

    if (derivedKey.toString('base64') === userEntity.password) {
      return userEntity;
    }

    return null;
  } catch (e) {
    logger.error(`failed to authenticate user: ${username} for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const create = async (username, password, firstName, lastName, correlationId) => {
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
    password: encryptedPassword,
  };

  await user.create({
    sub: id,
    given_name: firstName,
    family_name: lastName,
    email: username,
    salt,
    password: encryptedPassword,
    status: 1,
  });

  return newUser;
};

const list = async (page = 1, pageSize = 10, correlationId) => {
  logger.info(`Get user list for request: ${correlationId}`, { correlationId });

  const users = await user.findAll({
    order: [
      ['email', 'DESC'],
    ],
    limit: pageSize,
    offset: page !== 1 ? pageSize * page : 0,
  });

  if (!users) {
    return null;
  }

  const numberOfUsersResult = await user.findAll({
    attributes: [[Sequelize.fn('COUNT', Sequelize.col('sub')), 'NumberOfUsers']],
  });

  const numberOfUsers = numberOfUsersResult[0].get('NumberOfUsers');

  const pageOfUsers = numberOfUsers < pageSize ? 1 : Math.ceil(numberOfUsers / pageSize);

  return {
    users,
    numberOfPages: pageOfUsers,
  };
};

module.exports = {
  find,
  getUsers,
  changePassword,
  list,
  findByUsername,
  create,
  authenticate,
  changeStatus,
};
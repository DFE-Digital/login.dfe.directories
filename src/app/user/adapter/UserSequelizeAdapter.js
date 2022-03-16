'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const { user, userLegacyUsername, userPasswordPolicy } = require('./../../../infrastructure/repository');
const generateSalt = require('./../utils/generateSalt');
const { v4: uuid } = require('uuid');
const { promisify } = require('util');
const crypto = require('crypto');

const find = async (id, correlationId) => {
  try {
    logger.info(`Get user for request ${correlationId}`, { correlationId });
    const userEntity = await user.findOne({
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
    const userEntity = await user.findOne({
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

const findByLegacyUsername = async (username, correlationId) => {
  try {
    logger.info(`Get user by legacy username for request ${username}`, { correlationId });

    const userEntity = await user.findOne({
      include: [{
        model: userLegacyUsername,
        where: {
          legacy_username: {
            [Op.eq]: username,
          },
        },
      }],
    });
    if (!userEntity) {
      return null;
    }

    return userEntity;
  } catch (e) {
    logger.error(`error getting user with legacy username:${username} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
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

    await userEntity.update({
      salt,
      password: password.toString('base64'),
      password_reset_required: false,
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

    await userEntity.update({
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
    const passwordValid = derivedKey.toString('base64') === userEntity.password;

    if (passwordValid) {
      await userEntity.update({
        last_login: new Date().toISOString(),
      });
    }

    return {
      user: userEntity,
      passwordValid,
    };
  } catch (e) {
    logger.error(`failed to authenticate user: ${username} for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const create = async (username, password, firstName, lastName, legacyUsername, phone_number, correlationId, isMigrated) => {
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
    sub: id,
    given_name: firstName,
    family_name: lastName,
    email: username,
    salt,
    password: encryptedPassword,
    status: 1,
    phone_number: phone_number,
    isMigrated,
    password_reset_required: false,
  };

  await user.create(newUser);

  if (legacyUsername) {
    await userLegacyUsername.create({
      uid: id,
      legacy_username: legacyUsername,
    });
  }

  newUser.id = id;
  return newUser;
};

const list = async (page = 1, pageSize = 10, changedAfter = undefined, correlationId) => {
  logger.info(`Get user list for request: ${correlationId}`, { correlationId });

  let where;
  if (changedAfter) {
    where = {
      updatedAt: {
        [Op.gte]: changedAfter,
      },
    };
  }

  const users = await user.findAll({
    where,
    order: [
      ['email', 'DESC'],
    ],
    limit: pageSize,
    offset: page !== 1 ? pageSize * (page - 1) : 0,
  });

  if (!users) {
    return null;
  }

  const numberOfUsersResult = await user.findAll({
    attributes: [[Sequelize.fn('COUNT', Sequelize.col('sub')), 'NumberOfUsers']],
    where,
  });

  const numberOfUsers = numberOfUsersResult[0].get('NumberOfUsers');

  const pageOfUsers = numberOfUsers < pageSize ? 1 : Math.ceil(numberOfUsers / pageSize);

  return {
    users,
    numberOfPages: pageOfUsers,
  };
};


const update = async (uid, given_name, family_name, email, job_title, phone_number, legacyUsernames, correlationId) => {
  try {
    const userEntity = await find(uid, correlationId);

    if (!userEntity) {
      return null;
    }

    await userEntity.update({
      given_name,
      family_name,
      email,
      phone_number,
      job_title,
    });

    if (legacyUsernames) {
      await userLegacyUsername.destroy({
        where: {
          uid,
        },
      });
      for (let i = 0; i < legacyUsernames.length; i += 1) {
        await userLegacyUsername.create({
          uid: uid,
          legacy_username: legacyUsernames[i],
        });
      }
    }

    return userEntity;
  } catch (e) {
    logger.error(`update failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const getLegacyUsernames = async (uids, correlationId) => {
  try {
    logger.info(`Get legacy user names`, { correlationId });
    const legacyUsernameEntities = await userLegacyUsername.findAll({
      where: {
        uid: {
          [Op.or]: uids,
        },
      },
    });
    if (!legacyUsernameEntities) {
      return [];
    }

    return legacyUsernameEntities;
  } catch (e) {
    logger.error(`Get legacy user names - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const findUserPasswordPolicies = async (uid, correlationId) => {
  try {
    logger.info(`Get user pasword policies by user uid for request ${uid}`, { correlationId });
    const passwordPolicy = await userPasswordPolicy.findAll({
      where: {
        uid: {
          [Op.eq]: uid,
        },
      },
    });
    if (!passwordPolicy) {
      return null;
    }
    return passwordPolicy;
  } catch (e) {
    logger.error(`error getting user pasword policies for user with uid:${uid} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const addUserPasswordPolicy = async (uid, policyCode, correlationId) => {
  try {
    logger.info(`Add a user password policy for user ${uid}`, { correlationId });
    const id = uuid.v4();

    const newPasswordPolicy = {
      id: id,
      uid: uid,
      policyCode: policyCode,
      createdAt: Sequelize.fn('GETDATE'),
      updatedAt: Sequelize.fn('GETDATE'),
    };

    await userPasswordPolicy.create(newPasswordPolicy);

    return newPasswordPolicy;
  } catch (e) {
    logger.error(`failed to add user pasword policy for user with uid:${uid} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
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
  update,
  findByLegacyUsername,
  getLegacyUsernames,
  findUserPasswordPolicies,
  addUserPasswordPolicy,
};

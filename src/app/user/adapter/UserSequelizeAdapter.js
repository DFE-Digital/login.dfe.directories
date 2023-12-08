'use strict';

const Sequelize = require('sequelize');

const { Op } = Sequelize;
const { v4: uuid } = require('uuid');
const { promisify } = require('util');
const crypto = require('crypto');
const logger = require('../../../infrastructure/logger');
const {
  user, userLegacyUsername, userPasswordPolicy, passwordHistory, userPasswordHistory,
} = require('../../../infrastructure/repository');
const generateSalt = require('../utils/generateSalt');

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
const removePasswordHistory = async (recid, uid, correlationId) => {
  try {
    logger.info(`remove a password history item for user ${recid}`, { correlationId });

    await passwordHistory.destroy({ where: { id: recid } });
    await userPasswordHistory.destroy({ where: { passwordHistoryId: recid } });
  } catch (e) {
    logger.error(`failed to add user pasword policy for user with uid:${uid} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
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
const addPasswordHistory = async (uid, correlationId, password, salt) => {
  try {
    logger.info(`Add a password history for user ${uid}`, { correlationId });
    const id = uuid();
    const newPasswordHistory = {
      id,
      salt,
      password,
      createdAt: Sequelize.fn('GETDATE'),
      updatedAt: Sequelize.fn('GETDATE'),
    };
    const newUserPasswordHistory = {
      passwordHistoryId: id,
      userSub: uid,
      createdAt: Sequelize.fn('GETDATE'),
      updatedAt: Sequelize.fn('GETDATE'),
    };
    await passwordHistory.create(newPasswordHistory);
    await userPasswordHistory.create(newUserPasswordHistory);

    return newPasswordHistory;
  } catch (e) {
    logger.error(`failed to add  pasword history for user with uid:${uid} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};
const fetchPasswordHistory = async (uid, correlationId) => {
  try {
    let returnArray = [];
    let ids = [];
    const resultArray = await userPasswordHistory.findAll({
      where: {
        userSub: {
          [Op.eq]: uid,
        },
      },
      order: [
        ['createdAt', 'ASC'],
      ],
    });

    if (resultArray.length > 0) {
      ids = resultArray.map((i) => i.passwordHistoryId);

      returnArray = await passwordHistory.findAll({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
      });
    }

    return returnArray;
  } catch (e) {
    logger.error(`error saving pasword history for user with uid:${uid} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};
const fetchUserPasswordHistory = async (uid, correlationId) => {
  try {
    const resultArray = await userPasswordHistory.findAll({
      where: {
        userSub: {
          [Op.eq]: uid,
        },
      },
      order: [
        ['createdAt', 'ASC'],
      ],
    });

    return resultArray;
  } catch (e) {
    logger.error(`error saving pasword history for user with uid:${uid} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
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
const handlePasswordHistory = async (uid, oldSalt, oldPassword, limit, correlationId) => {
  try {
    const passwordHistorylist = await fetchUserPasswordHistory(uid, correlationId);
    if (passwordHistorylist.length > 0) {
      // check to see if we need to shuffle records
      if (passwordHistorylist.length >= limit) {
        await removePasswordHistory(passwordHistorylist[0].passwordHistoryId, uid, correlationId);
        await addPasswordHistory(uid, correlationId, oldPassword, oldSalt);
      } else {
        await addPasswordHistory(uid, correlationId, oldPassword, oldSalt);
      }
    } else {
      await addPasswordHistory(uid, correlationId, oldPassword, oldSalt);
    }
    return true;
  } catch (e) {
    logger.error(`handle password history failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};
const changePassword = async (uid, newPassword, correlationId) => {
  try {
    const userEntity = await find(uid, correlationId);
    const latestPasswordPolicy = process.env.POLICY_CODE || 'v3';

    if (!userEntity) {
      return null;
    }
    let limit = 0;
    const userPasswordPolicyEntity = await userEntity.getUserPasswordPolicy();
    const userPolicyCode = userPasswordPolicyEntity.filter((u) => u.policyCode === 'v3').length > 0 ? 'v3' : 'v2';
    const iterations = userPolicyCode === latestPasswordPolicy ? 120000 : 10000;
    if (userPasswordPolicyEntity[0].password_history_limit !== undefined) {
      limit = userPasswordPolicyEntity[0].password_history_limit;
    }

    if (limit > 0) {
      await handlePasswordHistory(uid, userEntity.salt, userEntity.password, limit, correlationId);
    }
    const salt = generateSalt();
    const password = crypto.pbkdf2Sync(newPassword, salt, iterations, 512, 'sha512');

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
    const latestPasswordPolicy = process.env.POLICY_CODE || 'v3';

    if (!userEntity) return null;
    const userPasswordPolicyEntity = await userEntity.getUserPasswordPolicy();
    const userPasswordPolicyCode = userPasswordPolicyEntity.filter((u) => u.policyCode === 'v3').length > 0 ? 'v3' : 'v2';
    const request = promisify(crypto.pbkdf2);
    const iterations = userPasswordPolicyCode === latestPasswordPolicy ? 120000 : 10000;

    const saltBuffer = Buffer.from(userEntity.salt, 'utf8');
    const derivedKey = await request(password, saltBuffer, iterations, 512, 'sha512');
    const passwordValid = derivedKey.toString('base64') === userEntity.password;
    let prevLoggin = null;
    if (userEntity.last_login !== null) {
      prevLoggin = userEntity.last_login.toISOString();
    }
    if (passwordValid) {
      await userEntity.update({
        last_login: new Date().toISOString(),
        prev_login: prevLoggin,
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
  const encryptedPassword = crypto.pbkdf2Sync(password, salt, 120000, 512, 'sha512').toString('base64');
  const id = uuid();

  const newUser = {
    sub: id,
    given_name: firstName,
    family_name: lastName,
    email: username,
    salt,
    password: encryptedPassword,
    status: 1,
    phone_number,
    isMigrated,
    password_reset_required: false,
  };

  await user.create(newUser);
  const pId = uuid();
  const historyLimit = 3;

  const newPasswordPolicy = {
    id: pId,
    uid: id,
    policyCode,
    password_history_limit: historyLimit,
    createdAt: Sequelize.fn('GETDATE'),
    updatedAt: Sequelize.fn('GETDATE'),
  };
  await userPasswordPolicy.create(newPasswordPolicy);

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
          uid,
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
    logger.info('Get legacy user names', { correlationId });
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

const removeUserPasswordPolicy = async (id, correlationId) => {
  try {
    await userPasswordPolicy.destroy({ where: { id } });
  } catch (e) {
    logger.error(`Error removing user password policy - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const addUserPasswordPolicy = async (uid, policyCode, correlationId) => {
  try {
    logger.info(`Add a user password policy for user ${uid}`, { correlationId });
    const id = uuid();
    const historyLimit = 3;

    const newPasswordPolicy = {
      id,
      uid,
      policyCode,
      password_history_limit: historyLimit,
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
  findUserPasswordPolicies,
  fetchPasswordHistory,
  addPasswordHistory,
  changePassword,
  list,
  findByUsername,
  create,
  authenticate,
  changeStatus,
  removeUserPasswordPolicy,
  update,
  findByLegacyUsername,
  getLegacyUsernames,
  addUserPasswordPolicy,
};

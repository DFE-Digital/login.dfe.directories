'use strict';

const Sequelize = require('sequelize');

const { Op, TableHints } = Sequelize;
const { v4: uuid } = require('uuid');
const {
  getLatestPolicyCode,
  hashPassword,
  hashPasswordWithUserPolicy,
} = require('login.dfe.password-policy');
const logger = require('../../../infrastructure/logger');
const config = require('../../../infrastructure/config');
const db = require('../../../infrastructure/repository/db');
const {
  userLegacyUsername,
} = require('../../../infrastructure/repository');
const generateSalt = require('../utils/generateSalt');

const { findByUsernameHelper } = require('./userSequelizeHelpers/findByUsernameHelper');
const findUserByEntraOidHelper = require('./userSequelizeHelpers/findUserByEntraOidHelper');
const findUserById = require('./userSequelizeHelpers/findUserByIdHelper');
const linkDsiUserWithEntra = require('./userSequelizeHelpers/linkDsiUserWithEntraHelper');

const activePasswordPolicyCode = process.env.POLICY_CODE ?? getLatestPolicyCode();
const passwordHistoryLimit = 3;

const find = async (id, correlationId) => await findUserById(id, correlationId);
const findByUsername = async (username, correlationId) =>  await findByUsernameHelper(username, correlationId);
const findByEntraOid = async (entraOid, correlationId) =>  await findUserByEntraOidHelper(entraOid, correlationId);
const linkUserWithEntraOid = async(uid, entraOid, firstName, lastName, correlationId) => await linkDsiUserWithEntra(uid, entraOid, firstName, lastName, correlationId);

const removePasswordHistory = async (recid, uid, correlationId) => {
  try {
    logger.info(`remove a password history item for user ${recid}`, { correlationId });

    await db.passwordHistory.destroy({ where: { id: recid } });
    await db.userPasswordHistory.destroy({ where: { passwordHistoryId: recid } });
  } catch (e) {
    logger.error(`failed to add user pasword policy for user with uid:${uid} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const findUserPasswordPolicies = async (uid, correlationId) => {
  try {
    logger.info(`Get user pasword policies by user uid for request ${uid}`, { correlationId });
    const passwordPolicy = await db.userPasswordPolicy.findAll({
      tableHint: TableHints.NOLOCK,
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
    await db.passwordHistory.create(newPasswordHistory);
    await db.userPasswordHistory.create(newUserPasswordHistory);

    return newPasswordHistory;
  } catch (e) {
    logger.error(`failed to add  pasword history for user with uid:${uid} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};
const isMatched = async (uid, newPass, correlationId) => {
  try {
    const userEntity = await find(uid, correlationId);
    if (!userEntity) {
      return null;
    }

    const userPasswordPolicyEntity = await db.userPasswordPolicy.findAll({
      tableHint: TableHints.NOLOCK,
      where: {
        uid: {
          [Op.eq]: userEntity.sub,
        },
      },
    });

    const derivedKey = await hashPasswordWithUserPolicy(newPass, userEntity.salt, userPasswordPolicyEntity);
    const passwordValid = derivedKey === userEntity.password;
    return passwordValid;
  } catch (e) {
    logger.error(`error saving pasword history for user with uid:${uid} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};
const fetchPasswordHistory = async (uid, correlationId) => {
  try {
    let returnArray = [];
    let ids = [];
    const resultArray = await db.userPasswordHistory.findAll({
      tableHint: TableHints.NOLOCK,
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

      returnArray = await db.passwordHistory.findAll({
        tableHint: TableHints.NOLOCK,
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
    const resultArray = await db.userPasswordHistory.findAll({
      tableHint: TableHints.NOLOCK,
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
    logger.info('Get user by legacy username for request', { correlationId });

    const userEntity = await db.user.findOne({
      tableHint: TableHints.NOLOCK,
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
    logger.error(`error getting user with legacy username - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const getUsers = async (uids, correlationId) => {
  try {
    logger.info(`Get Users for request: ${correlationId}`, { correlationId });

    const users = await db.user.findAll({
      tableHint: TableHints.NOLOCK,
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
    if (!userEntity) {
      return null;
    }

    await handlePasswordHistory(uid, userEntity.salt, userEntity.password, passwordHistoryLimit, correlationId);

    await db.userPasswordPolicy.findOrCreate({
      where: {
        uid,
        policyCode: activePasswordPolicyCode,
      },
      defaults: {
        id: uuid(),
        password_history_limit: passwordHistoryLimit,
        createdAt: Sequelize.fn('GETDATE'),
        updatedAt: Sequelize.fn('GETDATE'),
      },
    });

    const salt = generateSalt();
    const derivedKey = await hashPassword(activePasswordPolicyCode, newPassword, salt);

    await userEntity.update({
      salt,
      password: derivedKey,
      password_reset_required: false,
    });

    return userEntity;
  } catch (e) {
    logger.error(`change password failed for request ${correlationId} error: ${e}`, { correlationId });
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

    const userEntity = await db.user.sequelize.query('SELECT sub, policyCode, password, salt, status, password_reset_required, is_entra, entra_oid, entra_linked FROM [user] u LEFT JOIN user_password_policy upp ON u.sub = upp.uid WHERE email = :email', {
      replacements: { email: username },
      type: db.user.sequelize.QueryTypes.SELECT,
    });

    if (!userEntity || userEntity.length === 0) return null;

    const derivedKey = await hashPasswordWithUserPolicy(password, userEntity[0].salt, userEntity);
    const passwordValid = derivedKey === userEntity[0].password;

    if (passwordValid) {
      await updateLastLogin(userEntity[0].sub, correlationId)
    }
    return {
      user: {
        status: userEntity[0].status,
        id: userEntity[0].sub,
        passwordResetRequired: userEntity[0].password_reset_required,
      },
      passwordValid,
    };
  } catch (e) {
    logger.error(`failed to authenticate user for request ${correlationId}. Check Audit logs for username. error: ${e}`, { correlationId, stack: e.stack });
    logger.audit({
      type: 'authentication',
      subType: 'login-failed',
      env: config.hostingEnvironment.env,
      application: config.loggerSettings.applicationName,
      message: `failed to authenticate user: ${username} for request ${correlationId}.`,
    });
    throw (e);
  }
};

const updateLastLogin = async (uid, correlationId) => {
  try {
    await db.user.sequelize.query(
      `UPDATE [user]
        SET
          prev_login = CASE WHEN last_login is not null THEN last_login ELSE GETUTCDATE() END,
          last_login = GETUTCDATE()
        WHERE
          sub = :user_id`, {
            replacements: { user_id: uid },
            type: db.user.sequelize.QueryTypes.UPDATE,
          }
    );
  } catch (e) {
    logger.error(`updateLastLogin failed for request ${correlationId} error: ${e}`, { correlationId, stack: e.stack });
    throw (e);
  }
}

const create = async (username, password, firstName, lastName, legacyUsername, phone_number, correlationId, entraOid) => {
  logger.info(`Create user called for request ${correlationId}`, { correlationId });

  if (!username || (!password && !entraOid) || (password && entraOid)) {
    return null;
  }

  const exists = await findByUsernameHelper(username);
  if (exists) {
    return exists;
  }

  const salt = generateSalt();
  const derivedKey = password ?  await hashPassword(activePasswordPolicyCode, password, salt) : 'none'

  const id = uuid();

  const newUser = {
    sub: id,
    given_name: firstName,
    family_name: lastName,
    email: username,
    salt,
    password: derivedKey,
    status: 1,
    phone_number,
    password_reset_required: false,
    is_entra: !!entraOid,
    entra_oid: entraOid || null,
    entra_linked: entraOid ? Sequelize.fn('GETDATE') : null
  };

  const  createdUser = await db.user.create(newUser);

  await db.userPasswordPolicy.create({
    id: uuid(),
    uid: id,
    policyCode: activePasswordPolicyCode,
    password_history_limit: passwordHistoryLimit,
    createdAt: Sequelize.fn('GETDATE'),
    updatedAt: Sequelize.fn('GETDATE'),
  });

  if (legacyUsername) {
    await db.userLegacyUsername.create({
      uid: id,
      legacy_username: legacyUsername,
    });
  }

  newUser.id = id;
  newUser.entra_linked = createdUser.entra_linked;
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

  const users = await db.user.findAll({
    tableHint: TableHints.NOLOCK,
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

  const numberOfUsersResult = await db.user.findAll({
    tableHint: TableHints.NOLOCK,
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
      await db.userLegacyUsername.destroy({
        where: {
          uid,
        },
      });
      for (let i = 0; i < legacyUsernames.length; i += 1) {
        await db.userLegacyUsername.create({
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
    const legacyUsernameEntities = await db.userLegacyUsername.findAll({
      tableHint: TableHints.NOLOCK,
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

module.exports = {
  find,
  getUsers,
  findUserPasswordPolicies,
  fetchPasswordHistory,
  addPasswordHistory,
  changePassword,
  list,
  isMatched,
  findByUsername,
  create,
  authenticate,
  changeStatus,
  update,
  findByLegacyUsername,
  getLegacyUsernames,
  findByEntraOid,
  linkUserWithEntraOid,
  updateLastLogin
};

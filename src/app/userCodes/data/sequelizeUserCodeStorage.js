'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const { userCode } = require('./../../../infrastructure/repository');
const generateResetCode = require('./../utils/generateResetCode');
const generateSmsCode = require('./../utils/generateSmsCode');


const listUsersCodes = async (uid, correlationId) => {
  try {
    logger.info(`List user ${uid}'s codes for request ${correlationId}`, { correlationId });

    const codes = await userCode.findAll({
      where: {
        uid: {
          [Op.eq]: uid,
        },
      },
    });
    return codes.map(code => ({
      code: code.code,
      type: code.codeType,
      email: code.email,
    }));
  } catch (e) {
    logger.error(`List user ${uid}'s codes for request ${correlationId} failed - ${e.message}`, { correlationId });
    throw e;
  }
};

const getUserCode = async (uid, codeType, correlationId) => {
  try {
    logger.info(`Find User Code for request: ${correlationId}`, { correlationId });

    const code = await userCode.findOne({
      where: {
        uid: {
          [Op.eq]: uid,
        },
        codeType: {
          [Op.eq]: codeType,
        },
      },
    });
    if (!code) {
      return null;
    }
    return code;
  } catch (e) {
    logger.error(`Create User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const getUserCodeByEmail = async (email, codeType, correlationId) => {
  try {
    logger.info(`Find User Code by email for request: ${correlationId}`, { correlationId });
    const code = await userCode.findOne({
      where: {
        email: {
          [Op.eq]: email,
        },
        codeType: {
          [Op.eq]: codeType,
        },
      },
    });
    if (!code) {
      return null;
    }
    return code;
  } catch (e) {
    logger.error(`Find User Password Reset Code by email for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const createUserCode = async (uid, clientId, redirectUri, email, contextData, codeType, correlationId) => {
  try {
    logger.info(`Create User Password Reset Code for request: ${correlationId}`, { correlationId });

    if (!uid || !clientId || !redirectUri) {
      return null;
    }

    const code = codeType.toLowerCase() === 'smslogin' ? generateSmsCode() : generateResetCode();
    const userResetCode = {
      uid,
      code,
      clientId,
      redirectUri,
      email,
      contextData: JSON.stringify(contextData),
      codeType,
    };

    await userCode.create(userResetCode);

    return userResetCode;
  } catch (e) {
    logger.error(`Create User Password Reset Code for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const deleteUserCode = async (uid, correlationId) => {
  try {
    logger.info(`Delete User Code for request: ${correlationId}`, { correlationId });
    if (!uid) {
      return;
    }

    const code = await userCode.findByPk(uid);
    if (code) {
      await code.destroy();
    }
  } catch (e) {
    logger.error(`Delete User Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const updateUserCode = async (uid, email, contextData, redirectUri, clientId, codeType, correlationId) => {
  try {
    logger.info(`Update User Code for request: ${correlationId}`, { correlationId });
    const codeFromFind = await getUserCode(uid, codeType, correlationId);

    if (!codeFromFind) {
      return null;
    }

    let code = codeFromFind.code;
    if ((codeFromFind.codeType || '').toLowerCase() !== 'smslogin' && (!codeFromFind.email || codeFromFind.email.toLowerCase() !== email.toLowerCase())) {
      code = generateResetCode();
    }

    await codeFromFind.update({
      contextData: JSON.stringify(contextData),
      email,
      redirectUri,
      clientId,
      code,
    });
    return await await getUserCode(uid, codeType, correlationId);
  } catch (e) {
    logger.error(`Update User Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

module.exports = {
  listUsersCodes,
  getUserCode,
  getUserCodeByEmail,
  createUserCode,
  deleteUserCode,
  updateUserCode,
};

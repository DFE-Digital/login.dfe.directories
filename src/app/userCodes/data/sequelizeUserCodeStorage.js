'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;
const logger = require('./../../../infrastructure/logger');
const { userCode } = require('./../../../infrastructure/repository');
const generateResetCode = require('./../utils/generateResetCode');


const getUserCode = async (uid, codeType, correlationId) => {
  try {
    logger.info(`Find User Code for request: ${correlationId}`, { correlationId });

    const code = await userCode.find({
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
    const code = await userCode.find({
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

    const code = generateResetCode();
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

    const code = await userCode.findById(uid);
    if (code) {
      await code.destroy();
    }
  } catch (e) {
    logger.error(`Delete User Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const updateUserCode = async (uid, email, contextData, redirectUri, clientId, correlationId) => {
  try {
    logger.info(`Update User Code for request: ${correlationId}`, { correlationId });
    const codeFromFind = await userCode.findById(uid);

    if (!codeFromFind) {
      return null;
    }

    let code = codeFromFind.code;
    if (!codeFromFind.email || codeFromFind.email.toLowerCase() !== email.toLowerCase()) {
      code = generateResetCode();
    }

    await codeFromFind.updateAttributes({
      contextData: JSON.stringify(contextData),
      email,
      redirectUri,
      clientId,
      code,
    });
    return await userCode.findById(uid);
  } catch (e) {
    logger.error(`Update User Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

module.exports = {
  getUserCode,
  getUserCodeByEmail,
  createUserCode,
  deleteUserCode,
  updateUserCode,
};

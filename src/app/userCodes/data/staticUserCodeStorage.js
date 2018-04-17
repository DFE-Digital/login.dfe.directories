const logger = require('./../../../infrastructure/logger');

const getUserCode = async (uid, correlationId) => {
  try {
    logger.info(`Static - Find User Password Reset Code for request: ${correlationId}`, { correlationId });
    return Promise.resolve('ABC123');
  } catch (e) {
    logger.error(`Static - Create User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};


const getUserCodeByEmail = async (email, correlationId) => {
  try {
    logger.info(`Static - Find User Password Reset Code by email for request: ${correlationId}`, { correlationId });
    return Promise.resolve('ABC123');
  } catch (e) {
    logger.error(`Static - Create User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const createUserCode = async (uid, clientId, redirectUri, email, contextData, emailType, correlationId) => {
  try {
    logger.info(`Static - Create User Password Reset Code for request: ${correlationId}`, { correlationId });
    return Promise.resolve({
      uid,
      clientId,
      code: 'ABC123',
      redirectUri,
      email,
      contextData,
      emailType
    });
  } catch (e) {
    logger.error(`Static - Create User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const deleteUserCode = async (uid, correlationId) => {
  try {
    logger.info(`Static - Delete User Password Reset Code for request: ${correlationId}`, { correlationId });
    return Promise.resolve(uid);
  } catch (e) {
    logger.error(`Static - Delete User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const updateUserCode = async (uid, email, contextData, redirectUri, clientId) => {
  return Promise.resolve({
    uid,
    clientId,
    code: 'ABC123',
    redirectUri,
    email,
    contextData,
  });
};

module.exports = {
  getUserCode,
  getUserCodeByEmail,
  createUserCode,
  deleteUserCode,
  updateUserCode,
};
const logger = require('./../../../infrastructure/logger');

const getUserPasswordResetCode = async (uid, correlationId) => {
  try {
    logger.info(`Static - Find User Password Reset Code for request: ${correlationId}`, { correlationId });
    return Promise.resolve('ABC123');
  } catch (e) {
    logger.error(`Static - Create User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const createUserPasswordResetCode = async (uid, clientId, redirectUri, correlationId) => {
  try {
    logger.info(`Static - Create User Password Reset Code for request: ${correlationId}`, { correlationId });
    return Promise.resolve({
      uid,
      clientId,
      code: 'ABC123',
      redirectUri,
    });
  } catch (e) {
    logger.error(`Static - Create User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const deleteUserPasswordResetCode = async (uid, correlationId) => {
  try {
    logger.info(`Static - Delete User Password Reset Code for request: ${correlationId}`, { correlationId });
    return Promise.resolve(uid);
  } catch (e) {
    logger.error(`Static - Delete User Password Reset Code failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

module.exports = {
  getUserPasswordResetCode,
  createUserPasswordResetCode,
  deleteUserPasswordResetCode,
};
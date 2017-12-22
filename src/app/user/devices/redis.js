const config = require('./../../../infrastructure/config');
const logger = require('./../../../infrastructure/logger');
const IORedis = require('ioredis');

const redis = new IORedis(config.devices.redisUrl);

const getUserDevices = async (userId, correlationId) => {
  try {
    logger.info(`Get user devices for request: ${correlationId}`);
    const json = await redis.get(`UserDevices_${userId}`);
    if (!json) {
      return [];
    }
    return JSON.parse(json);
  } catch (e) {
    logger.error(`Get user devices failed for request ${correlationId} error: ${e}`);
    throw (e);
  }
};

const createUserDevices = async (userId, device, correlationId) => {
  try {
    logger.info(`Create user devices for request: ${correlationId}`);
    const devices = await getUserDevices(userId);
    devices.push(device);

    await redis.set(`UserDevices_${userId}`, JSON.stringify(devices));
  } catch (e) {
    logger.error(`Create user devices failed for request ${correlationId} error: ${e}`);
    throw (e);
  }
};

module.exports = {
  getUserDevices,
  createUserDevices,
};

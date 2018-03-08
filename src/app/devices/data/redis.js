const config = require('./../../../infrastructure/config');
const logger = require('./../../../infrastructure/logger');
const IORedis = require('ioredis');

const tls = config.devices.redisUrl.includes('6380');
const redis = new IORedis(config.devices.redisUrl, { tls });

const readBatchOfKeys = async ({ match = '*', count = 0 }) => {
  return new Promise((resolve, reject) => {
    const keys = [];
    const opts = {
      match,
    };

    if (count > 0) {
      opts.count = count;
    }

    redis.scanStream(opts)
      .on('data', (batch) => {
        for (let i = 0; i < batch.length; i += 1) {
          keys.push(batch[i]);
        }
      })
      .on('end', () => {
        resolve(keys);
      })
      .on('error', reject);
  });
};

const getUserDevices = async (userId, correlationId) => {
  try {
    logger.info(`Get user devices for request: ${correlationId}`, { correlationId });
    const json = await redis.get(`UserDevices_${userId}`);
    if (!json) {
      return [];
    }
    return JSON.parse(json);
  } catch (e) {
    logger.error(`Get user devices failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const createUserDevices = async (userId, device, correlationId) => {
  try {
    logger.info(`Create user devices for request: ${correlationId}`, { correlationId });
    const devices = await getUserDevices(userId);
    devices.push(device);

    await redis.set(`UserDevices_${userId.toLowerCase()}`, JSON.stringify(devices));
  } catch (e) {
    logger.error(`Create user devices failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const deleteUserDevice = async (userId, device, correlationId) => {
  try {
    logger.info(`Removing user device: ${device.serialNumber} for request: ${correlationId}`, { correlationId });
    const devices = await getUserDevices(userId);

    const indexOfSerialNumber = devices.findIndex(c => c.serialNumber === device.serialNumber);

    if (indexOfSerialNumber !== -1) {
      devices.splice(indexOfSerialNumber, 1);
    }

    await redis.set(`UserDevices_${userId}`, JSON.stringify(devices));
  } catch (e) {
    logger.error(`Remove user device: ${device.serialNumber} failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const getUserAssociatedToDevice = async (type, serialNumber, correlationId) => {
  try {
    logger.info(`Get user associated to device for request: ${correlationId}`, { correlationId });

    const allKeys = await readBatchOfKeys({ match: 'UserDevices_*' });
    for (let i = 0; i < allKeys.length; i += 1) {
      const userId = allKeys[i].substr(12);
      const userDevices = await getUserDevices(userId, correlationId);
      if (userDevices && userDevices.find(d => d.type.toLowerCase() === type.toLowerCase() && d.serialNumber === serialNumber)) {
        return userId;
      }
    }
    return null;
  } catch (e) {
    logger.error(`Get user devices failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

module.exports = {
  getUserDevices,
  createUserDevices,
  getUserAssociatedToDevice,
  deleteUserDevice,
};

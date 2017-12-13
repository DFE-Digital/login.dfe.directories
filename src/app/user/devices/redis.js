const config = require('./../../../infrastructure/config');
const IORedis = require('ioredis');
const redis = new IORedis(config.devices.redisUrl);

const getUserDevices = async (userId) => {
  const json = await redis.get(`UserDevices_${userId}`);
  if (!json) {
    return [];
  }

  return JSON.parse(json);
};

const createUserDevices = async (userId, device) => {
  const devices = await getUserDevices(userId);
  devices.push(device);

  await redis.set(`UserDevices_${userId}`, JSON.stringify(devices));
};

module.exports = {
  getUserDevices,
  createUserDevices,
};

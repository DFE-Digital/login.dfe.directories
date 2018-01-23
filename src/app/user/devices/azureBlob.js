const config = require('./../../../infrastructure/config');
const logger = require('./../../../infrastructure/logger');
const rp = require('request-promise');
const { URL } = require('url');

const getBlobUrl = (blobName) => {
  const sasUrl = new URL(config.devices.containerUrl);
  return `${sasUrl.origin}${sasUrl.pathname}/${blobName}${sasUrl.search}`;
};

const getUserDevices = async (userId, correlationId) => {
  try {
    logger.info(`Get user devices for request: ${correlationId}`, { correlationId });
    const json = await rp({
      method: 'GET',
      uri: getBlobUrl(`${userId}.json`),
    });
    if (!json) {
      return [];
    }
    return JSON.parse(json);
  } catch (e) {
    if (e.statusCode === 404) {
      return null;
    }
    logger.error(`Get user devices failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const createUserDevices = async (userId, device, correlationId) => {
  try {
    logger.info(`Create user devices for request: ${correlationId}`, { correlationId });
    const devices = await getUserDevices(userId);
    devices.push(device);

    await rp({
      method: 'PUT',
      uri: getBlobUrl(`${userId}.json`),
      headers: {
        'x-ms-blob-type': 'BlockBlob',
      },
      body: JSON.stringify(devices),
    });
  } catch (e) {
    logger.error(`Create user devices failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

module.exports = {
  getUserDevices,
  createUserDevices,
};

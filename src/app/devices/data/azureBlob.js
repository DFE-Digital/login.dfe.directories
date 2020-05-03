const config = require('./../../../infrastructure/config');
const logger = require('./../../../infrastructure/logger');
const rp = require('request-promise');
const { URL } = require('url');
const { DOMParser } = require('xmldom');
const xpath = require('xpath');

const getBlobUrl = (blobName = '') => {
  const sasUrl = new URL(config.devices.containerUrl);
  return `${sasUrl.origin}${sasUrl.pathname}/${blobName}${sasUrl.search}`;
};

const listBlobs = async () => {
  const blobListXml = await rp({
    method: 'GET',
    uri: `${getBlobUrl()}&restype=container&comp=list`,
  });
  const blobListDoc = new DOMParser().parseFromString(blobListXml);
  return xpath.select('/EnumerationResults/Blobs/Blob/Name', blobListDoc).map((node) => {
    return node.childNodes[0].nodeValue;
  });
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

const deleteUserDevice = async (userId, device, correlationId) => {
  try {
    logger.info(`Removing user device: ${device.serialNumber} for request: ${correlationId}`, { correlationId });
    const devices = await getUserDevices(userId);

    const indexOfSerialNumber = devices.findIndex(c => c.serialNumber === device.serialNumber);

    if (indexOfSerialNumber !== -1) {
      devices.splice(indexOfSerialNumber, 1);
    }

    await rp({
      method: 'PUT',
      uri: getBlobUrl(`${userId}.json`),
      headers: {
        'x-ms-blob-type': 'BlockBlob',
      },
      body: JSON.stringify(devices),
    });
  } catch (e) {
    logger.error(`Remove user device: ${device.serialNumber} failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const getUserAssociatedToDevice = async (type, serialNumber, correlationId) => {
  try {
    logger.info(`Get user associated to device for request: ${correlationId}`, { correlationId });

    const userIdWithDevices = (await listBlobs()).map(blobName => blobName.substr(0, blobName.length - 5));
    for (let i = 0; i < userIdWithDevices.length; i += 1) {
      const userId = userIdWithDevices[i];
      const userDevices = await getUserDevices(userId, correlationId);
      if (userDevices.find(d => d.type.toLowerCase() === type.toLowerCase() && d.serialNumber === serialNumber)) {
        return userId;
      }
    }
    return null;
  } catch (e) {
    if (e.statusCode === 404) {
      return null;
    }
    logger.error(`Get user devices failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

const listUserDeviceAssociations = async (pageNumber, pageSize, correlationId) => {
  return Promise.reject(new Error('listUserDeviceAssociations not implemented for azure blob adapter'));
};

module.exports = {
  getUserDevices,
  createUserDevices,
  deleteUserDevice,
  getUserAssociatedToDevice,
  listUserDeviceAssociations,
};

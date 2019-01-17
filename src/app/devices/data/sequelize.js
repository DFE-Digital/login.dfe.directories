const logger = require('./../../../infrastructure/logger');
const { userDevice, user } = require('./../../../infrastructure/repository');
const { Op } = require('sequelize');

const mapEntityToDevice = (entity) => {
  return {
    id: entity.id,
    type: entity.deviceType,
    serialNumber: entity.serialNumber,
    user: entity.user,
  };
};
const mapDeviceToEntity = (device, userId) => {
  return {
    id: device.id,
    uid: userId,
    deviceType: device.type,
    serialNumber: device.serialNumber,
  };
};

const getUserDevices = async (userId, correlationId) => {
  try {
    const entities = await userDevice.findAll({
      where: {
        uid: {
          [Op.eq]: userId,
        },
      },
    });

    if (!entities || entities.length === 0) {
      return [];
    }

    return entities.map(mapEntityToDevice);
  } catch (e) {
    logger.error(`Error getting user devices for ${userId}`, { correlationId });
    throw e;
  }
};

const createUserDevices = async (userId, device, correlationId) => {
  try {
    const entity = mapDeviceToEntity(device, userId);
    await userDevice.upsert(entity);
  } catch (e) {
    logger.error(`Error creating device mapping for user ${userId}, device ${JSON.stringify(device)}`, { correlationId });
    throw e;
  }
};

const deleteUserDevice = async (userId, device, correlationId) => {
  try {
    await userDevice.destroy({
      where: {
        uid: {
          [Op.eq]: userId,
        },
        deviceType: {
          [Op.eq]: device.type,
        },
        serialNumber: {
          [Op.eq]: device.serialNumber,
        },
      },
    });
  } catch (e) {
    logger.error(`Error deleting device mapping for user ${userId}, device ${JSON.stringify(device)}`, { correlationId });
    throw e;
  }
};

const getUserAssociatedToDevice = async (type, serialNumber, correlationId) => {
  try {
    const entity = await userDevice.find({
      where: {
        deviceType: {
          [Op.eq]: type,
        },
        serialNumber: {
          [Op.eq]: serialNumber,
        },
      },
    });
    return entity ? entity.uid : null;
  } catch (e) {
    logger.error(`Error getting user associated to device ${type} / ${serialNumber}`, { correlationId });
    throw e;
  }
};

const listUserDeviceAssociations = async (pageNumber, pageSize, correlationId) => {
  try {
    const resultset = await userDevice.findAndCountAll({
      order: ['deviceType', 'serialNumber', 'uid'],
      limit: pageSize,
      offset: pageSize * (pageNumber - 1),
      include: ['user'],
    });

    const deviceAssociations = resultset.rows.map(mapEntityToDevice);
    return {
      deviceAssociations,
      page: pageNumber,
      numberOfPages: resultset.count < pageSize ? 1 : Math.ceil(resultset.count / pageSize),
    };
  } catch (e) {
    logger.error(`Error listing page of user device associations (page ${pageNumber} of size ${pageSize})`, { correlationId });
    throw e;
  }
};

module.exports = {
  getUserDevices,
  createUserDevices,
  deleteUserDevice,
  getUserAssociatedToDevice,
  listUserDeviceAssociations,
};

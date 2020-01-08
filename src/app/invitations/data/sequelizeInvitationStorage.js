const { invitation, invitationDevice, invitationCallback } = require('./../../../infrastructure/repository');
const logger = require('./../../../infrastructure/logger');
const { Op } = require('sequelize');
const uuid = require('uuid/v4');

const mapEntityToInvitation = (entity) => {
  const overrides = entity.overrideSubject || entity.overrideBody ? {
    subject: entity.overrideSubject,
    body: entity.overrideBody,
  } : undefined;
  let callbacks;
  const origin = entity.originClientId || entity.originRedirectUri ? {
    clientId: entity.originClientId,
    redirectUri: entity.originRedirectUri,
  } : undefined;
  let device;
  let oldCredentials;


  if (entity.callbacks && entity.callbacks.length > 0) {
    callbacks = entity.callbacks.map((cbEntity) => ({
      sourceId: cbEntity.sourceId,
      callback: cbEntity.callbackUrl,
      clientId: cbEntity.clientId,
    }));
  }

  if (entity.devices && entity.devices.length > 0) {
    device = {
      type: entity.devices[0].deviceType,
      serialNumber: entity.devices[0].serialNumber,
    };
  }

  if (entity.previousUsername || entity.previousPassword || entity.previousSalt) {
    oldCredentials = {
      username: entity.previousUsername,
      password: entity.previousPassword,
      salt: entity.previousSalt,
      source: 'EAS',
    };
  }


  return {
    firstName: entity.firstName,
    lastName: entity.lastName,
    email: entity.email,
    origin,
    selfStarted: entity.selfStarted,
    callbacks,
    overrides,
    device,
    oldCredentials,
    code: entity.code,
    id: entity.id,
    deactivated: entity.deactivated,
    reason: entity.reason,
    isCompleted: entity.completed,
    userId: entity.uid,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    isMigrated: entity.isMigrated,
  };
};
const mapInvitationToEntities = (model) => {
  const invitationEntity = {
    id: model.id,
    email: model.email,
    code: model.code,
    firstName: model.firstName,
    lastName: model.lastName,
    originClientId: model.origin ? model.origin.clientId : undefined,
    originRedirectUri: model.origin ? model.origin.redirectUri : undefined,
    selfStarted: model.selfStarted,
    overrideSubject: model.overrides ? model.overrides.subject : undefined,
    overrideBody: model.overrides ? model.overrides.body : undefined,
    previousUsername: model.oldCredentials ? model.oldCredentials.username : undefined,
    previousPassword: model.oldCredentials ? model.oldCredentials.password : undefined,
    previousSalt: model.oldCredentials ? model.oldCredentials.salt : undefined,
    deactivated: model.deactivated,
    reason: model.reason,
    completed: model.isCompleted,
    uid: model.userId,
    isMigrated: model.isMigrated,
    approverEmail: model.approverEmail,
    orgName: model.orgName,
    isApprover: model.isApprover,
  };

  const deviceEntities = [];
  if (model.device) {
    deviceEntities.push({
      id: uuid(),
      invitationId: model.id,
      deviceType: model.device.type,
      serialNumber: model.device.serialNumber,
    });
  }

  let callbackEntities = [];
  if (model.callbacks) {
    callbackEntities = model.callbacks.map(cb => ({
      invitationId: model.id,
      sourceId: cb.sourceId,
      callbackUrl: cb.callback,
      clientId: cb.clientId,
    }));
  }

  return {
    invitationEntity,
    deviceEntities,
    callbackEntities,
  };
};


const list = async (pageNumber, pageSize, changedAfter, correlationId) => {
  try {
    let where;
    if (changedAfter) {
      where = {
        updatedAt: {
          [Op.gte]: changedAfter,
        },
      };
    }

    const resultset = await invitation.findAndCountAll({
      where,
      order: [
        ['email', 'DESC'],
      ],
      include: ['callbacks', 'devices'],
      limit: pageSize,
      offset: pageSize * (pageNumber - 1),
    });
    const invitations = resultset.rows.map(mapEntityToInvitation);

    return {
      invitations,
      page: pageNumber,
      numberOfPages: resultset.count < pageSize ? 1 : Math.ceil(resultset.count / pageSize),
    };
  } catch (e) {
    logger.error(`Error listing page ${pageNumber} of size ${pageSize} of invitations changed after ${changedAfter} - ${e.message}`, {
      correlationId,
      stack: e.stack
    });
    throw e;
  }
};


const getUserInvitation = async (id, correlationId) => {
  try {
    const entity = await invitation.find({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
      include: ['callbacks', 'devices'],
    });

    return entity ? mapEntityToInvitation(entity) : undefined;
  } catch (e) {
    logger.error(`Error getting invitation with id ${id} - ${e.message}`, { correlationId, stack: e.stack });
    throw e;
  }
};

const createUserInvitation = async (userInvitation, correlationId) => {
  try {
    userInvitation.id = userInvitation.id || uuid();

    const entities = mapInvitationToEntities(userInvitation);

    await invitation.create(entities.invitationEntity);
    for (let i = 0; i < entities.deviceEntities.length; i++) {
      await invitationDevice.create(entities.deviceEntities[i]);
    }
    for (let i = 0; i < entities.callbackEntities.length; i++) {
      await invitationCallback.create(entities.callbackEntities[i]);
    }

    return await getUserInvitation(userInvitation.id);
  } catch (e) {
    logger.error(`Error creating invitation for ${userInvitation.email} (id: ${userInvitation.id}) - ${e.message}`, {
      correlationId,
      stack: e.stack,
    });
    throw e;
  }
};

const deleteInvitation = async (id, correlationId) => {
  try {
    await invitationDevice.destroy({
      where: {
        invitationId: {
          [Op.eq]: id,
        },
      },
    });

    await invitationCallback.destroy({
      where: {
        invitationId: {
          [Op.eq]: id,
        },
      },
    });

    await invitation.destroy({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });
  } catch (e) {
    logger.error(`Error deleting invitation ${invitation.id} - ${e.message}`, { correlationId, stack: e.stack });
    throw e;
  }
};

const updateInvitation = async (userInvitation, correlationId) => {
  try {
    const entities = mapInvitationToEntities(userInvitation);

    await invitation.upsert(entities.invitationEntity);

    await invitationDevice.destroy({
      where: {
        invitationId: {
          [Op.eq]: userInvitation.id,
        },
      },
    });
    for (let i = 0; i < entities.deviceEntities.length; i++) {
      invitationDevice.create(entities.deviceEntities[i]);
    }

    await invitationCallback.destroy({
      where: {
        invitationId: {
          [Op.eq]: userInvitation.id,
        },
      },
    });
    for (let i = 0; i < entities.callbackEntities.length; i++) {
      invitationCallback.create(entities.callbackEntities[i]);
    }

    return await getUserInvitation(userInvitation.id);
  } catch (e) {
    logger.error(`Error updating ${invitation.id} - ${e.message}`, { correlationId, stack: e.stack, });
    throw e;
  }
};

const findInvitationForEmail = async (email, excludeComplete, correlationId) => {
  try {
    const where = {
      email: {
        [Op.eq]: email,
      },
    };
    if (excludeComplete) {
      where.completed = {
        [Op.eq]: false,
      };
    }
    const entity = await invitation.find({
      where,
      include: ['callbacks', 'devices'],
    });

    return entity ? mapEntityToInvitation(entity) : undefined;
  } catch (e) {
    logger.error(`Error finding invitation with email ${email} - ${e.message}`, { correlationId, stack: e.stack });
    throw e;
  }
};

const getInvitationIdAssociatedToDevice = async (type, serialNumber, correlationId) => {
  try {
    const deviceEntity = await invitationDevice.find({
      where: {
        deviceType: {
          [Op.eq]: type,
        },
        serialNumber: {
          [Op.eq]: serialNumber,
        },
      },
      include: ['invitation'],
    });

    return deviceEntity && !deviceEntity.invitation.completed ? deviceEntity.invitation.id : null;
  } catch (e) {
    logger.error(`Error finding invitation associated to device ${type}/${serialNumber} - ${e.message}`, {
      correlationId,
      stack: e.stack,
    });
    throw e;
  }
};

module.exports = {
  list,
  deleteInvitation,
  createUserInvitation,
  getUserInvitation,
  updateInvitation,
  findInvitationForEmail,
  getInvitationIdAssociatedToDevice,
};

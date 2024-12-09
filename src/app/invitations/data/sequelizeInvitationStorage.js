const {
  invitation,
  invitationCallback,
} = require("./../../../infrastructure/repository");
const logger = require("./../../../infrastructure/logger");
const { Op } = require("sequelize");
const { v4: uuid } = require("uuid");
const db = require("../../../infrastructure/repository/db");

const mapEntityToInvitation = (entity) => {
  const overrides =
    entity.overrideSubject || entity.overrideBody
      ? {
          subject: entity.overrideSubject,
          body: entity.overrideBody,
        }
      : undefined;
  let callbacks;
  const origin =
    entity.originClientId || entity.originRedirectUri
      ? {
          clientId: entity.originClientId,
          redirectUri: entity.originRedirectUri,
        }
      : undefined;

  if (entity.callbacks && entity.callbacks.length > 0) {
    callbacks = entity.callbacks.map((cbEntity) => ({
      sourceId: cbEntity.sourceId,
      callback: cbEntity.callbackUrl,
      clientId: cbEntity.clientId,
    }));
  }

  return {
    firstName: entity.firstName,
    lastName: entity.lastName,
    email: entity.email,
    origin,
    selfStarted: entity.selfStarted,
    callbacks,
    overrides,
    code: entity.code,
    id: entity.id,
    deactivated: entity.deactivated,
    reason: entity.reason,
    isCompleted: entity.completed,
    userId: entity.uid,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    approverEmail: entity.approverEmail,
    orgName: entity.orgName,
    isApprover: entity.isApprover,
    codeMetaData: entity.codeMetaData,
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
    deactivated: model.deactivated,
    reason: model.reason,
    completed: model.isCompleted,
    uid: model.userId,
    approverEmail: model.approverEmail,
    orgName: model.orgName,
    isApprover: model.isApprover,
    codeMetaData: model.codeMetaData,
  };

  let callbackEntities = [];
  if (model.callbacks) {
    callbackEntities = model.callbacks.map((cb) => ({
      invitationId: model.id,
      sourceId: cb.sourceId,
      callbackUrl: cb.callback,
      clientId: cb.clientId,
    }));
  }

  return {
    invitationEntity,
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

    const resultset = await db.invitation.findAndCountAll({
      where,
      order: [["email", "DESC"]],
      include: ["callbacks"],
      limit: pageSize,
      offset: pageSize * (pageNumber - 1),
    });
    const invitations = resultset.rows.map(mapEntityToInvitation);

    return {
      invitations,
      page: pageNumber,
      numberOfPages:
        resultset.count < pageSize ? 1 : Math.ceil(resultset.count / pageSize),
    };
  } catch (e) {
    logger.error(
      `Error listing page ${pageNumber} of size ${pageSize} of invitations changed after ${changedAfter} - ${e.message}`,
      {
        correlationId,
        stack: e.stack,
      },
    );
    throw e;
  }
};

const getUserInvitation = async (id, correlationId) => {
  try {
    const entity = await db.invitation.findOne({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
      include: ["callbacks"],
    });

    return entity ? mapEntityToInvitation(entity) : undefined;
  } catch (e) {
    logger.error(`Error getting invitation with id ${id} - ${e.message}`, {
      correlationId,
      stack: e.stack,
    });
    throw e;
  }
};

const createUserInvitation = async (userInvitation, correlationId) => {
  try {
    userInvitation.id = userInvitation.id || uuid();

    const entities = mapInvitationToEntities(userInvitation);

    await db.invitation.create(entities.invitationEntity);
    for (let i = 0; i < entities.callbackEntities.length; i++) {
      await db.invitationCallback.create(entities.callbackEntities[i]);
    }

    return await getUserInvitation(userInvitation.id);
  } catch (e) {
    logger.error(
      `Error creating invitation for (id: ${userInvitation.id}) - ${e.message}`,
      {
        correlationId,
        stack: e.stack,
      },
    );
    throw e;
  }
};

const deleteInvitation = async (id, correlationId) => {
  try {
    await db.invitationCallback.destroy({
      where: {
        invitationId: {
          [Op.eq]: id,
        },
      },
    });

    await db.invitation.destroy({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });
  } catch (e) {
    logger.error(`Error deleting invitation ${invitation.id} - ${e.message}`, {
      correlationId,
      stack: e.stack,
    });
    throw e;
  }
};

const updateInvitation = async (userInvitation, correlationId) => {
  try {
    const entities = mapInvitationToEntities(userInvitation);

    await db.invitation.upsert(entities.invitationEntity);

    await db.invitationCallback.destroy({
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
    logger.error(`Error updating ${invitation.id} - ${e.message}`, {
      correlationId,
      stack: e.stack,
    });
    throw e;
  }
};

const findInvitationForEmail = async (
  email,
  excludeComplete,
  correlationId,
) => {
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
    const entity = await db.invitation.findOne({
      where,
      include: ["callbacks"],
    });

    return entity ? mapEntityToInvitation(entity) : undefined;
  } catch (e) {
    logger.error(`Error finding invitation - ${e.message}`, {
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
};

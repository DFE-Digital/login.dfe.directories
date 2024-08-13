const logger = require('../../../../infrastructure/logger');
const findUserById = require('./findUserByIdHelper');
const findUserByEntraOidHelper = require('./findUserByEntraOidHelper');

const linkUserWithEntraOid = async (uid, entraOid, firstName, lastName, correlationId) => {
  try {
    const userEntity = await findUserById(uid, correlationId);

    if (!userEntity) {
      return null;
    }

    const alreadyLinkedUserEntity = await findUserByEntraOidHelper(entraOid, correlationId);
    if (alreadyLinkedUserEntity) {
      logger.error(`Cannot link entra oid '${entraOid}' with DSI user '${userEntity.sub}' because it has already been linked to a DSI user '${alreadyLinkedUserEntity.sub}' (correlation id: ${correlationId})`, { correlationId });
      return null;
    }

    const updatedFields = {
      entra_oid: entraOid,
      is_entra: true,
      entra_linked: new Date().toISOString(),
    };

    if (firstName && firstName.trim().length > 0) {
      updatedFields.given_name = firstName.trim();
    }
    if (lastName && lastName.trim().length > 0) {
      updatedFields.family_name = lastName.trim();
    }

    const updatedUser = await userEntity.update(updatedFields);

    return updatedUser;
  } catch (e) {
    logger.error(`linkUserWithEntra failed for request ${correlationId} error: ${e}`, { correlationId });
    throw (e);
  }
};

module.exports = linkUserWithEntraOid;

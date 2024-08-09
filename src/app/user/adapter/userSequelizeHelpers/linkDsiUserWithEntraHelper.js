const logger = require('../../../../infrastructure/logger');
const findUserById = require('./findUserByIdHelper');
const findUserByEntraOidHelper = require('./findUserByEntraOidHelper');

const linkUserWithEntraOid = async (uid, entraOid, firstName, lastName, correlationId) => {
  try {
    const userEntity = await findUserById(uid, correlationId);

    if (!userEntity) {
      return null;
    }

    // If the entraOid is already linked to a user then don't permit it to be assigned to someone else.
    const alreadyLinkedUserEntity = await findUserByEntraOidHelper(entraOid, correlationId);
    if (alreadyLinkedUserEntity) {
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

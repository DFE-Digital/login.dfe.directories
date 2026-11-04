const logger = require("../../../../infrastructure/logger");
const findUserById = require("./findUserByIdHelper");
const findUserByEntraOidHelper = require("./findUserByEntraOidHelper");

const linkUserWithEntraOid = async (
  uid,
  entraOid,
  firstName,
  lastName,
  correlationId,
) => {
  try {
    const userEntity = await findUserById(uid, correlationId);

    if (!userEntity) {
      return null;
    }

    const alreadyLinkedUserEntity = await findUserByEntraOidHelper(
      entraOid,
      correlationId,
    );
    if (alreadyLinkedUserEntity) {
      logger.error(
        `Cannot link entra oid '${entraOid}' with DSI user '${userEntity.sub}' because it has already been linked to a DSI user '${alreadyLinkedUserEntity.sub}' (correlation id: ${correlationId})`,
        { correlationId },
      );
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
    if (e.name === "SequelizeUniqueConstraintError") {
      let winningUser;
      try {
        winningUser = await findUserByEntraOidHelper(entraOid, correlationId);
      } catch {
        // The re-query itself failed - surface the original constraint
        // error rather than this transient re-query failure.
        logger.error(
          `linkUserWithEntra failed for request ${correlationId} error: ${e}`,
          { correlationId },
        );
        throw e;
      }

      if (winningUser) {
        if (winningUser.sub?.toLowerCase() === uid?.toLowerCase()) {
          logger.info(
            `Link entra oid race detected for DSI user '${uid}' - entra oid '${entraOid}' was already linked to DSI user '${winningUser.sub}' by a concurrent request, returning the winning record (correlation id: ${correlationId})`,
            { correlationId },
          );
          return winningUser;
        }

        // A different DSI user won the race for this entra_oid - this is a
        // genuine conflict, not a self-race. Mirror the existing
        // already-linked-to-a-different-user behaviour above: log and
        // return null rather than returning the other user's record.
        logger.error(
          `Cannot link entra oid '${entraOid}' with DSI user '${uid}' because it has already been linked to a DSI user '${winningUser.sub}' (correlation id: ${correlationId})`,
          { correlationId },
        );
        return null;
      }
    }

    logger.error(
      `linkUserWithEntra failed for request ${correlationId} error: ${e}`,
      { correlationId },
    );
    throw e;
  }
};

module.exports = linkUserWithEntraOid;

const Sequelize = require('sequelize');

const { Op, TableHints } = Sequelize;
const logger = require('../../../../infrastructure/logger');
const db = require('../../../../infrastructure/repository/db');

const findUserByEntraOidHelper = async (entraOid, correlationId) => {
  try {
    logger.info('Get user by entraOid for request', { correlationId });

    const userEntity = await db.user.findOne({
      tableHint: TableHints.NOLOCK,
      where: {
        entra_oid: {
          [Op.eq]: entraOid,
        },
      },
    });
    if (!userEntity) {
      return null;
    }

    return userEntity;
  } catch (e) {
    logger.error(
      `error getting user with entraOid - ${e.message} for request ${correlationId} error: ${e}`,
      { correlationId },
    );
    throw e;
  }
};

module.exports = findUserByEntraOidHelper;

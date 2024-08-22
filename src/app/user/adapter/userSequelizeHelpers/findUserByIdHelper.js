const Sequelize = require('sequelize');

const { Op, TableHints } = Sequelize;
const logger = require('../../../../infrastructure/logger');
const db = require('../../../../infrastructure/repository/db');

const findUserById = async (id, correlationId) => {
  try {
    logger.info(`Get user for request ${correlationId}`, { correlationId });
    const userEntity = await db.user.findOne({
      tableHint: TableHints.NOLOCK,
      where: {
        sub: {
          [Op.eq]: id,
        },
      },
    });
    if (!userEntity) {
      return null;
    }

    return userEntity;
  } catch (e) {
    logger.error(`error getting user id:${id} - ${e.message} for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

module.exports = findUserById;

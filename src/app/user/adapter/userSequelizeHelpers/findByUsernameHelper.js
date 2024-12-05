const Sequelize = require("sequelize");

const { Op, TableHints } = Sequelize;
const logger = require("../../../../infrastructure/logger");
const db = require("../../../../infrastructure/repository/db");

const findByUsernameHelper = async (username, correlationId) => {
  try {
    logger.info("Get user for request", { correlationId });
    const userEntity = await db.user.findOne({
      tableHint: TableHints.NOLOCK,
      where: {
        email: {
          [Op.eq]: username,
        },
      },
    });
    if (!userEntity) {
      return null;
    }

    return userEntity;
  } catch (e) {
    logger.error(
      `error getting user with username - ${e.message} for request ${correlationId} error: ${e}`,
      { correlationId },
    );
    throw e;
  }
};

module.exports = { findByUsernameHelper };

const assert = require("assert");
const config = require("./../../../infrastructure/config");
const logger = require("./../../../infrastructure/logger");

const getUserCodeAdapter = () => {
  const userCodesAdapter = config.userCodes;
  if (userCodesAdapter === null || userCodesAdapter === undefined) {
    return null;
  }

  if (userCodesAdapter.type === "sequelize") {
    return require("./sequelizeUserCodeStorage");
  }

  if (userCodesAdapter.type === "static") {
    logger.warn("Static code generation being used - codes are not stored");
    return require("./staticUserCodeStorage");
  }
  if (userCodesAdapter.type === "redis") {
    assert(userCodesAdapter.params.redisUrl, "redisUrl is required");
    return require("./redisUserCodeStorage");
  }

  return null;
};

module.exports = getUserCodeAdapter();

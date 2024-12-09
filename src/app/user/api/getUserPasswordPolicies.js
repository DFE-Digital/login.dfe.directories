const userAdapter = require("../adapter");
const logger = require("../../../infrastructure/logger");

const getUserPasswordPolicies = async (req, res) => {
  try {
    let userPasswordPolicies = await userAdapter.findUserPasswordPolicies(
      req.params.uid,
      req.header("x-correlation-id"),
    );

    if (!userPasswordPolicies) {
      userPasswordPolicies = [];
    }
    return res.send(userPasswordPolicies);
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = getUserPasswordPolicies;

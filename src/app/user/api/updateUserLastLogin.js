const userAdapter = require("../adapter");
const logger = require("../../../infrastructure/logger");

const updateUserLastLogin = async (req, res) => {
  try {
    await userAdapter.updateLastLogin(
      req.params.uid,
      req.header("x-correlation-id"),
    );
    return res.status(200).send();
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = updateUserLastLogin;

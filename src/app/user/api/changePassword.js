const userAdapter = require("./../adapter");
const logger = require("./../../../infrastructure/logger");

const changePassword = async (req, res) => {
  try {
    if (!req.params.id || !req.body.password) {
      return res.status(400).send();
    }

    const user = await userAdapter.changePassword(
      req.params.id,
      req.body.password,
      req.header("x-correlation-id"),
    );
    if (!user) {
      return res.status(404).send();
    }
    return res.send(true);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = changePassword;

const userAdapter = require("../adapter");
const logger = require("../../../infrastructure/logger");

const getUserStatus = async (req, res) => {
  const user_id = req.params.id;
  const correlation_id = req.header("x-correlation-id");
  try {
    const user = await userAdapter.find(user_id, correlation_id);
    if (!user) {
      return res.status(404).send();
    }
    const userDeactivation = userAdapter.findUserDeactivation(
      user_id,
      correlation_id,
    );
    const result = {
      id: user.id,
      status: user.status,
      deactivation: [],
    };

    if (userDeactivation) {
      result.deactivation = userDeactivation;
    }
    return res.send(result);
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = getUserStatus;

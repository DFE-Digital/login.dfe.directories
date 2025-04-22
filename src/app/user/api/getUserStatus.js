const userAdapter = require("../adapter");
const logger = require("../../../infrastructure/logger");
const { isUuid } = require("./helpers");

const getUserStatus = async (req, res) => {
  const user_id = req.params.id;
  const correlation_id = req.header("x-correlation-id");
  if (!req.params.id || isUuid(req.params.id.toLowerCase()) === false) {
    return res.status(400).send();
  }
  try {
    const user = await userAdapter.find(user_id, correlation_id);
    if (!user) {
      return res.status(404).send();
    }
    const userStatusChangeReasons =
      await userAdapter.findUserStatusChangeReasons(user_id, correlation_id);
    const result = {
      id: user.sub,
      status: user.status,
      statusChangeReasons: [],
    };

    if (userStatusChangeReasons) {
      result.statusChangeReasons = userStatusChangeReasons;
    }
    return res.send(result);
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = getUserStatus;

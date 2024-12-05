const userAdapter = require("./../adapter");
const logger = require("./../../../infrastructure/logger");

const changeStatus = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).send();
    }

    const user = await userAdapter.changeStatus(
      req.params.id,
      1,
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

module.exports = changeStatus;

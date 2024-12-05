const userAdapter = require("./../adapter");
const logger = require("./../../../infrastructure/logger");

const passwordHisory = async (req, res) => {
  try {
    const results = await userAdapter.fetchPasswordHistory(
      req.params.uid,
      req.header("x-correlation-id"),
    );
    if (!results) {
      return res.status(404).send();
    }
    return res.send(results);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = passwordHisory;

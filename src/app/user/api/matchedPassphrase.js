const userAdapter = require("../adapter");
const logger = require("../../../infrastructure/logger");

const matchedPassphrase = async (req, res) => {
  try {
    if (req.body.newPass === undefined || req.body.newPass === "") {
      return res.status(404).send();
    }
    const correlationId = req.header("x-correlation-id");
    const results = await userAdapter.isMatched(
      req.params.uid,
      req.body.newPass,
      req.header("x-correlation-id"),
    );
    logger.info(
      `perfomed a passord match  ${req.params.uid} with (reason: removed)`,
      { correlationId },
    );
    return results ? res.send(results) : res.sendStatus(404);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = matchedPassphrase;

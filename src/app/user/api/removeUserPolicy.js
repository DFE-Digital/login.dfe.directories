const userAdapter = require('../adapter');
const logger = require('../../../infrastructure/logger');

const removeUserPolicy = async (req, res) => {
  try {
    const correlationId = req.header('x-correlation-id');
    await userAdapter.removeUserPasswordPolicy(req.params.uid, req.header('x-correlation-id'));
    logger.info(`removed user password history row  ${req.params.uid} with (reason: removed)`, { correlationId });
    return res.send(true);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = removeUserPolicy;

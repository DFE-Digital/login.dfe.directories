const userAdapter = require('../adapter');
const logger = require('../../../infrastructure/logger');

const removeUserPolicy = async (req, res) => {
  try {
    await userAdapter.removeUserPasswordPolicy(req.params.uid, req.header('x-correlation-id'));
   
    return res.send(true);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = removeUserPolicy;

const userAdapter = require('../adapter');
const logger = require('../../../infrastructure/logger');

const getUserPasswordPolicy = async (req, res) => {
  try {
    if (!req.params.uid) {
      return res.status(400).send();
    }

    let userPasswordPolicy = await userAdapter.getUserPasswordPolicy(req.params.uid, req.header('x-correlation-id'));

    if (!userPasswordPolicy) {
      userPasswordPolicy = null;
    }
    return res.send(userPasswordPolicy);
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = getUserPasswordPolicy;

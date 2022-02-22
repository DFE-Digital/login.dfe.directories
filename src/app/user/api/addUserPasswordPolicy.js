const logger = require('../../../infrastructure/logger');
const { findUserPasswordPolicies, addUserPasswordPolicy } = require('../adapter/UserSequelizeAdapter');

const addPasswordPolicy = async (req, res) => {
  try {
    await addUserPasswordPolicy(req.params.uid.toLowerCase(),
      req.body.policyCode, req.header('x-correlation-id'));

    const userPasswordPolicies = await findUserPasswordPolicies(req.params.uid, req.header('x-correlation-id'));

    return res.status(202).contentType('json').send(JSON.stringify(userPasswordPolicies));
  } catch (e) {
    logger.error(e);
    return res.status(500).send();
  }
};

module.exports = addPasswordPolicy;

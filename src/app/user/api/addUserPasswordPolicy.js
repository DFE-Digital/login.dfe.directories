const logger = require('../../../infrastructure/logger');
const { findUserPasswordPolicies, addUserPasswordPolicy } = require('../adapter/UserSequelizeAdapter');

const addPasswordPolicy = async (req, res) => {
  try {
    if (!req.body.policyCode) {
      return res.status(400).contentType('json').send(JSON.stringify({
        message: 'Must provide a password policy code',
      }));
    }

    await addUserPasswordPolicy(req.params.uid.toLowerCase(),
      req.body.policyCode, req.header('x-correlation-id'));

    const userPasswordPolicies = await findUserPasswordPolicies(req.params.uid, req.header('x-correlation-id'));

    return res.status(202).contentType('json').send(JSON.stringify(userPasswordPolicies));
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = addPasswordPolicy;

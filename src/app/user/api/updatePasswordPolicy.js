const logger = require('../../../infrastructure/logger');
const { updateUserPasswordPolicy } = require('../adapter/UserSequelizeAdapter');

const addPasswordPolicy = async (req, res) => {
  try {
    if (!req.body.policyCode) {
      return res.status(400).contentType('json').send(JSON.stringify({
        message: 'Must provide a password policy code',
      }));
    }
    await updateUserPasswordPolicy(req.params.uid.toLowerCase(), req.body.policyCode, req.header('x-correlation-id'));

    return res.status(202).contentType('json').send("success");
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = addPasswordPolicy;

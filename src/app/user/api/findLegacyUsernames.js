const userAdapter = require('./../adapter');
const logger = require('./../../../infrastructure/logger');

const find = async (req, res) => {
  try {
    if (!req.params.uid) {
      return res.status(400).send();
    }
    const user = await userAdapter.getLegacyUsernames([req.params.uid], req.header('x-correlation-id'));
    if (!user) {
      return res.status(404).send();
    }
    return res.send(user);
  } catch (e) {
    logger.error(e);
    return res.status(500).send();
  }
};

module.exports = find;

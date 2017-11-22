const UserAdapter = require('./../adapter');
const config = require('./../../../infrastructure/config')();
const logger = require('./../../../infrastructure/logger');

const changePassword = async (req, res) => {
  const userAdapter = UserAdapter(config);
  try {
    if (!req.params.id || !req.body.password) {
      res.status(400).send();
    }

    const user = await userAdapter.changePassword(req.params.id, req.body.password);
    if (!user) {
      res.status(404).send();
    }
    res.send(true);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = changePassword;


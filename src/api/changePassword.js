const UserAdapter = require('../user');
const config = require('../config');
const logger = require('../logger');

const changePassword = async (req, res) => {
  const userAdapter = UserAdapter(config, req.params.directoryId);
  try {
    const user = await userAdapter.changePassword(req.body.uid, req.body.password);
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


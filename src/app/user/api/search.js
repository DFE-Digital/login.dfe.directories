const UserAdapter = require('./../adapter');
const config = require('./../../../infrastructure/config')();
const logger = require('./../../../infrastructure/logger');
const {safeUser} = require('./../../../utils');

const search = async (req, res) => {
  const userAdapter = UserAdapter(config);
  try {
    const users = await userAdapter.getUsers(req.query.id.split(','));

    if (!users) {
      return res.status(404).send();
    }
    return res.send(users.map(user => safeUser(user)));
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = search;

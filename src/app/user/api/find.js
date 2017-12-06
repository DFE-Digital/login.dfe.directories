const UserAdapter = require('./../adapter');
const config = require('./../../../infrastructure/config')();
const logger = require('./../../../infrastructure/logger');
const { safeUser } = require('./../../../utils');

const find = async (req, res) => {
  const userAdapter = UserAdapter(config);
  try {
    if (!req.params.id) {
      return res.status(400).send();
    }

    if (req.params.id.indexOf(',') !== -1) {
      const users = await userAdapter.getUsers(req.params.id.split(','));

      if (!users) {
        return res.status(404).send();
      }
      return res.send(users.map(user => safeUser(user)));
    }
    let user = await userAdapter.find(req.params.id);
    if (!user) {
      user = await userAdapter.findByUsername(req.params.id);
    }
    if (!user) {
      return res.status(404).send();
    }

    return res.send(safeUser(user));
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = find;

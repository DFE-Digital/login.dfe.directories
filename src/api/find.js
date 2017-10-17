const UserAdapter = require('../user');
const config = require('../config');
const logger = require('../logger');

const find = async (req, res) => {
  const userAdapter = UserAdapter(config, req.params.directoryId);
  try {
    let user = await userAdapter.find(req.params.id);
    if (!user) {
      user = await userAdapter.findByUsername(req.params.id);
    }
    if (!user) {
      res.status(404).send();
    }

    const safeUser = {};
    Object.keys(user).forEach((item) => {
      if (item.toLowerCase() !== 'password' && item.toLowerCase() !== 'salt') {
        safeUser[item] = user[item];
      }
    });
    res.send(safeUser);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = find;

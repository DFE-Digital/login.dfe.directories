const userAdapter = require('./../adapter');
const config = require('./../../../infrastructure/config');
const logger = require('./../../../infrastructure/logger');
const { safeUser } = require('./../../../utils');

const find = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).send();
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

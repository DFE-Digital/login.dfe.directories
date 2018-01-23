const userAdapter = require('./../adapter');
const logger = require('./../../../infrastructure/logger');
const { safeUser } = require('./../../../utils');

const isUuid = value => value.match(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/);

const find = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).send();
    }

    let user;
    if (isUuid(req.params.id.toLowerCase())) {
      user = await userAdapter.find(req.params.id, req.header('x-correlation-id'));
    } else {
      user = await userAdapter.findByUsername(req.params.id, req.header('x-correlation-id'));
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

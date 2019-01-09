const userAdapter = require('./../adapter');
const logger = require('./../../../infrastructure/logger');
const { safeUser } = require('./../../../utils');

const searchV2 = async (req, res) => {
  try {
    const users = await userAdapter.getUsers(req.body.ids.split(','), req.header('x-correlation-id'));

    if (!users) {
      return res.status(404).send();
    }
    return res.send(users.map(user => safeUser(user)));
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};


module.exports = searchV2;

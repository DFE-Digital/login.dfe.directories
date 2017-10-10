const UserAdapter = require('../user');
const config = require('../config');
const logger = require('../logger');

const authenticate = async (req, res) => {
  const userAdapter = UserAdapter(config, req.params.directoryId);
  try {
    const result = await userAdapter.authenticate(
      req.body.username,
      req.body.password,
      req.body.sig,
    );

    if (result) {
      res.send(result.sub);
    } else {
      res.status(401).send();
    }
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = authenticate;


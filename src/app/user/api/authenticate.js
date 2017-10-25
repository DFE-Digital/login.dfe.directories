const UserAdapter = require('./../adapter');
const config = require('./../../../infrastructure/config')();
const logger = require('./../../../infrastructure/logger');

const authenticate = async (req, res) => {
  const userAdapter = UserAdapter(config);
  try {
    const result = await userAdapter.authenticate(
      req.body.username,
      req.body.password,
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


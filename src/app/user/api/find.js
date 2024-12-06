const userAdapter = require("./../adapter");
const logger = require("./../../../infrastructure/logger");
const { safeUser } = require("./../../../utils");
const { isUuid, addLegacyUsernames } = require("./helpers");

const find = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).send();
    }

    let userEntity;
    if (isUuid(req.params.id.toLowerCase())) {
      userEntity = await userAdapter.find(
        req.params.id,
        req.header("x-correlation-id"),
      );
    } else {
      userEntity = await userAdapter.findByUsername(
        req.params.id,
        req.header("x-correlation-id"),
      );
    }

    if (!userEntity) {
      return res.status(404).send();
    }

    const user = safeUser(userEntity);

    await addLegacyUsernames(user, req.header("x-correlation-id"));

    return res.send(user);
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = find;

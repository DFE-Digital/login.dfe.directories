const userAdapter = require("../adapter");
const logger = require("../../../infrastructure/logger");

const { safeUser } = require("../../../utils");
const { isUuid, addLegacyUsernames } = require("./helpers");

const findByEntraOid = async (req, res) => {
  try {
    if (
      !req.params.entraOid ||
      isUuid(req.params.entraOid.toLowerCase()) === false
    ) {
      return res.status(400).send();
    }

    const userEntity = await userAdapter.findByEntraOid(
      req.params.entraOid,
      req.header("x-correlation-id"),
    );

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

module.exports = findByEntraOid;

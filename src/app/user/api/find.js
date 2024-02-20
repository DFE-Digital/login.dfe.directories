const userAdapter = require('./../adapter');
const logger = require('./../../../infrastructure/logger');
const { safeUser } = require('./../../../utils');

const isUuid = value => value.match(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/);

const addLegacyUsernames = async (user, correlationId) => {
  const legacyUsernames = await userAdapter.getLegacyUsernames([user.sub], correlationId);
  const userLegacyUsernames = legacyUsernames.filter(lun => lun.uid.toLowerCase() === user.sub.toLowerCase());
  if (userLegacyUsernames && userLegacyUsernames.length > 0) {
    user.legacyUsernames = userLegacyUsernames.map(lun => lun.legacy_username);
  }
};

const find = async (req, res) => {
  try {
    console.log('find');
    if (!req.params.id) {
      return res.status(400).send();
    }

    let userEntity;
    if (isUuid(req.params.id.toLowerCase())) {
      userEntity = await userAdapter.find(req.params.id, req.header('x-correlation-id'));
    } else {
      userEntity = await userAdapter.findByUsername(req.params.id, req.header('x-correlation-id'));
    }

    if (!userEntity) {
      return res.status(404).send();
    }

    const user = safeUser(userEntity);

    await addLegacyUsernames(user, req.header('x-correlation-id'));

    return res.send(user);
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = find;

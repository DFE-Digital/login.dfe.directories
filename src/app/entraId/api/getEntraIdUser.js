const { getEntraAccountByEntraSub, getEntraAccountByEmail } = require('../../../infrastructure/entraId/index');
const logger = require('../../../infrastructure/logger');

const isUuid = (value) => value.match(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/);

const getEntraIdUser = async (req, res) => {
  try {
    if (!req.params.userId) {
      return res.status(400).send();
    }

    let userEntity;
    if (isUuid(req.params.userId.toLowerCase())) {
      userEntity = await getEntraAccountByEntraSub(req.params.userId);
    } else {
      userEntity = await getEntraAccountByEmail(req.params.userId);
    }

    return res.send(userEntity);
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = getEntraIdUser;

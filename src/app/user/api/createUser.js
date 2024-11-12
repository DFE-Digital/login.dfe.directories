const { ServiceNotificationsClient } = require('login.dfe.jobs-client');
const { findByUsername, create, findByEntraOid } = require('../adapter');
const logger = require('../../../infrastructure/logger');
const config = require('../../../infrastructure/config');
const { safeUser } = require('../../../utils');

const createUser = async (req, res) => {
  const correlationId = req.header('x-correlation-id');

  try {
    const {
      email,
      password,
      entraOid,
      firstName,
      lastName,
      legacy_username,
      phone_number,
    } = req.body;

    if ((!email || !firstName || !lastName) || (!password && !entraOid) || (password && entraOid)) {
      return res.status(400).send();
    }

    const existingUser = await findByUsername(email, correlationId);

    if (existingUser) {
      return res.status(409).send();
    }

    if (entraOid) {
      const existingUserWithEntraOid = await findByEntraOid(entraOid);
      if (existingUserWithEntraOid) {
        logger.error(`Unable to create the user as the entraOid is already associated with user '${existingUserWithEntraOid.sub}' (correlationId: '${correlationId}')`, { correlationId });
        return res.status(409).send();
      }
    }

    const user = await create(email, password, firstName, lastName, legacy_username, phone_number, req.header('x-correlation-id'), entraOid);

    if (config.toggles && config.toggles.notificationsEnabled) {
      const serviceNotificationsClient = new ServiceNotificationsClient({
        connectionString: config.notifications.connectionString,
      });
      const jobId = await serviceNotificationsClient.notifyUserUpdated(safeUser(user));
      logger.info(`Send user updated notification for ${user.sub} with job id ${jobId} (reason: create)`, { correlationId });
    }

    return res.send(safeUser(user));
  } catch (e) {
    logger.error(e, { correlationId });
    res.status(500).send(e);
  }
};

module.exports = createUser;

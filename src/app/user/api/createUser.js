const { findByUsername, create } = require('./../adapter');
const logger = require('./../../../infrastructure/logger');
const config = require('./../../../infrastructure/config');
const { safeUser } = require('./../../../utils');
const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');

const createUser = async (req, res) => {
  const correlationId = req.header('x-correlation-id');
  try {
    if (!req.body.email || !req.body.password || !req.body.firstName || !req.body.lastName) {
      return res.status(400).send();
    }

    const existingUser = await findByUsername(req.body.email, correlationId);

    if (existingUser) {
      return res.status(409).send();
    }

    const user = await create(req.body.email, req.body.password, req.body.firstName, req.body.lastName, req.body.legacy_username, req.body.phone_number, req.header('x-correlation-id'));

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


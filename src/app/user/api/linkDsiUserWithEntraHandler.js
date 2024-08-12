const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');
const { linkUserWithEntraOid } = require('../adapter');
const logger = require('../../../infrastructure/logger');
const { isUuid } = require('./helpers');
const config = require('../../../infrastructure/config');
const { safeUser } = require('../../../utils');

/**
 * POST body with {"entraOid" : "", lastName": "", "firstName": ""}
 * lastName & firstName optional.
 */
const linkDsiUserWithEntra = async (req, res) => {
  const correlationId = req.header('x-correlation-id');
  const { uid } = req.params;
  const { firstName, lastName, entraOid } = req.body || {};

  if (!uid || !entraOid) {
    return res.status(404).send();
  }

  if (isUuid(uid) === false || isUuid(entraOid) === false) {
    return res.status(404).send();
  }

  const updatedEntity = await linkUserWithEntraOid(uid, entraOid, firstName, lastName, correlationId);

  if (!updatedEntity) {
    return res.status(404).send();
  }

  const safeEntity = safeUser(updatedEntity);

  if (config.toggles && config.toggles.notificationsEnabled) {
    const serviceNotificationsClient = new ServiceNotificationsClient({
      connectionString: config.notifications.connectionString,
    });
    const jobId = await serviceNotificationsClient.notifyUserUpdated(safeEntity);
    logger.info(`Send user updated notification for ${updatedEntity.sub} with job id ${jobId} (reason: patch)`, { correlationId });
  }

  res.send(safeEntity);
};

module.exports = linkDsiUserWithEntra;

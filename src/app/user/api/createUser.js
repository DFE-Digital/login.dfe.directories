const { findByUsername, create } = require('./../adapter');
const logger = require('./../../../infrastructure/logger');
const config = require('./../../../infrastructure/config');
const { safeUser } = require('./../../../utils');
const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');

const getNotificationsUser = (user) => {
  const notificationsUser = safeUser(user);
  notificationsUser.status = {
    id: user.status,
  };
  return notificationsUser;
};

const createUser = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password || !req.body.firstName || !req.body.lastName) {
      return res.status(400).send();
    }

    const existingUser = await findByUsername(req.body.email, req.header('x-correlation-id'));

    if (existingUser) {
      return res.status(409).send();
    }

    const user = await create(req.body.email, req.body.password, req.body.firstName, req.body.lastName, req.body.legacy_username, req.body.phone_number, req.header('x-correlation-id'));

    const serviceNotificationsClient = new ServiceNotificationsClient({
      connectionString: config.notifications.connectionString,
    });
    await serviceNotificationsClient.notifyUserUpdated(getNotificationsUser(user));

    return res.send(safeUser(user));
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = createUser;


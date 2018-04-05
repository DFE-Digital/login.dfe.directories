'use strict';

const config = require('./../../../infrastructure/config');
const logger = require('./../../../infrastructure/logger');
const { getUserInvitation, updateInvitation } = require('./../data/redisInvitationStorage');
const userStorage = require('./../../user/adapter');
const { safeUser } = require('./../../../utils');
const NotificationClient = require('login.dfe.notifications.client');

const createUser = async (req, res) => {
  try {
    const invId = req.params.id;
    const password = req.body.password;

    if (!invId) {
      return res.status(400).send();
    }

    if (!password) {
      return res.status(400).send();
    }

    const invitation = await getUserInvitation(req.params.id, req.header('x-correlation-id'));
    if (!invitation) {
      return res.status(404).send();
    }

    const user = await userStorage.create(invitation.email, password, invitation.firstName, invitation.lastName, req.header('x-correlation-id'));

    const completedInvitation = Object.assign(invitation, { isCompleted: true, userId: user.id });
    await updateInvitation(completedInvitation);

    const notificationClient = new NotificationClient({
      connectionString: config.notifications.connectionString,
    });
    notificationClient.sendRegistrationComplete(user.email, user.given_name, user.family_name);

    return res.status(201).send(safeUser(user));
  } catch (e) {
    logger.error(e);
    res.status(500).send(e.message);
  }
};

module.exports = createUser;

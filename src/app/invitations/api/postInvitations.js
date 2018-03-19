'use strict';

const config = require('./../../../infrastructure/config');
const logger = require('./../../../infrastructure/logger');
const storage = require('./../data/redisInvitationStorage');
const { generateInvitationCode } = require('./../utils');
const NotificationClient = require('login.dfe.notifications.client');

const classifyInvite = (invitation) => {
  if (invitation.oldCredentials && invitation.oldCredentials.source.toUpperCase() === 'EAS') {
    return 'eas-migration';
  }
  return 'new-user';
};

const post = async (req, res) => {
  try {
    if (!req.body.firstName || !req.body.lastName || !req.body.email) {
      res.status(400).send();
      return;
    }

    const requestedInvite = Object.assign({}, req.body);
    requestedInvite.code = generateInvitationCode();
    const invitation = await storage.createUserInvitation(requestedInvite, req.header('x-correlation-id'));

    const notificationClient = new NotificationClient({
      connectionString: config.notifications.connectionString,
    });

    const classOfInvite = classifyInvite(requestedInvite);
    if (classOfInvite === 'eas-migration') {
      await notificationClient.sendMigrationInvitation(
        requestedInvite.email, requestedInvite.firstName, requestedInvite.lastName, invitation.id, requestedInvite.code);
    } else {
      await notificationClient.sendInvitation(
        requestedInvite.email, requestedInvite.firstName, requestedInvite.lastName, invitation.id, requestedInvite.code);
    }

    res.status(201).send(invitation);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = post;

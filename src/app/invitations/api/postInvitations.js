'use strict';

const config = require('./../../../infrastructure/config')();
const logger = require('./../../../infrastructure/logger');
const Storage = require('./../data/redisInvitationStorage');
const NotificationClient = require('login.dfe.notifications.client');

const post = async (req, res) => {
  try {
    if (!req.body.firstName || !req.body.lastName || !req.body.email) {
      res.status(400).send();
      return;
    }

    const storage = new Storage();

    const invitation = await storage.createUserInvitation(req.body);

    const notificationClient = new NotificationClient({
      connectionString: config.notifications.connectionString,
    });

    await notificationClient.sendInvitation(
      req.body.email, req.body.firstName, req.body.lastName, invitation.id);

    res.status(201).send(invitation);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = post;

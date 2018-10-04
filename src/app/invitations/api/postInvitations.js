'use strict';

const config = require('./../../../infrastructure/config');
const logger = require('./../../../infrastructure/logger');
const storage = require('./../data');
const userStorage = require('./../../user/adapter');
const { generateInvitationCode } = require('./../utils');
const NotificationClient = require('login.dfe.notifications.client');
const { getOidcClientById } = require('./../../../infrastructure/hotConfig');
const sendInvitation = require('./../utils/sendInvitation');

const checkIfExistingUserAndNotifyIfIs = async (invitation) => {
  const account = await userStorage.findByUsername(invitation.email);
  if (account) {
    let friendlyName;
    const client = invitation.origin ? await getOidcClientById(invitation.origin.clientId) : undefined;
    if (client) {
      friendlyName = client.friendlyName;
    }

    const notificationClient = new NotificationClient({
      connectionString: config.notifications.connectionString,
    });
    await notificationClient.sendRegisterExistingUser(invitation.email, invitation.firstName, invitation.lastName,
      friendlyName, invitation.origin.redirectUri);

    return true;
  }
  return false;
};

const post = async (req, res) => {
  try {
    if (!req.body.firstName || !req.body.lastName || !req.body.email) {
      res.status(400).send();
      return;
    }

    const requestedInvite = Object.assign({}, req.body);

    if (await checkIfExistingUserAndNotifyIfIs(requestedInvite)) {
      res.status(202).send();
      return;
    }

    let invitation = await storage.findInvitationForEmail(requestedInvite.email, true, req.header('x-correlation-id'));
    let statusCode = 202;
    if (!invitation) {
      requestedInvite.code = generateInvitationCode();
      invitation = await storage.createUserInvitation(requestedInvite, req.header('x-correlation-id'));
      statusCode = 201;
    }

    await sendInvitation(invitation);

    res.status(statusCode).send(invitation);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = post;

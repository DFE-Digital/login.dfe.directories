'use strict';

const logger = require('./../../../infrastructure/logger');
const Storage = require('./../data/redisInvitationStorage');

const put = async (req, res) => {
  try {
    if (!req.body.firstName || !req.body.lastName || !req.params.user_email) {
      res.status(400).send();
      return;
    }

    const storage = new Storage();

    const invitation = await storage.getUserInvitation(req.params.user_email);

    if (!invitation) {
      await storage.createUserInvitation(req.params.user_email, req.body);
      // todo add call to notifications client
      res.status(201).send();
      return;
    }
    res.status(200).send();
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = put;
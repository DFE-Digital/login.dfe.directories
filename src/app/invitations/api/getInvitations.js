'use strict';

const logger = require('./../../../infrastructure/logger');
const storage = require('./../data/redisInvitationStorage');

const get = async (req, res) => {
  try {
    if (!req.params.id) {
      res.status(400).send();
      return;
    }

    const invitation = await storage.getUserInvitation(req.params.id);

    if (!invitation) {
      res.status(404).send();
      return;
    }

    res.send(invitation);
  } catch (e) {
    logger.error(e);
    res.status(500).send();
  }
};

module.exports = get;

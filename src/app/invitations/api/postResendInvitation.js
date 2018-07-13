'use strict';

const logger = require('./../../../infrastructure/logger');
const sendInvitation = require('./../utils/sendInvitation');
const storage = require('./../data/redisInvitationStorage');

const post = async (req, res) => {
  try {
    const invitation = await storage.getUserInvitation(req.params.id, req.header('x-correlation-id'));
    if (!invitation) {
      return res.status(400).send();
    }
    await sendInvitation(invitation);
    return res.status(200).send();
  } catch (e) {
    logger.error(e);
    return res.status(500).send(e);
  }
};

module.exports = post;

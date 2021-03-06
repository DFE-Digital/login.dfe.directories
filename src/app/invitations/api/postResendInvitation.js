'use strict';

const logger = require('./../../../infrastructure/logger');
const sendInvitation = require('./../utils/sendInvitation');
const storage = require('./../data');

const post = async (req, res) => {
  try {
    if (!req.params.id) {
      res.status(400).send();
      return;
    }
    const invitation = await storage.getUserInvitation(req.params.id, req.header('x-correlation-id'));
    if (!invitation) {
      res.status(404).send();
      return;
    }
    await sendInvitation(invitation);
    res.status(200).send(invitation);
  } catch (e) {
    logger.error(e);
    res.status(500).send(e);
  }
};

module.exports = post;

'use strict';

const logger = require('./../../../infrastructure/logger');
const storage = require('./../data/redisInvitationStorage');

const pageSize = 25;

const listInvitations = async (req, res) => {
  try {
    const pageNumber = req.query.page && !isNaN(parseInt(req.query.page)) ? parseInt(req.query.page) : 1;

    const invitations = await storage.list(pageNumber, pageSize);

    res.contentType('json').send(invitations);
  } catch (e) {
    logger.error(e);
    res.status(500).send();
  }
};

module.exports = listInvitations;

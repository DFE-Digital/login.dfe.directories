'use strict';

const logger = require('./../../../infrastructure/logger');
const storage = require('./../data/redisInvitationStorage');
const UserStorage = require('./../../user/adapter');
const { safeUser } = require('./../../../utils');

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

    const userAdapter = UserStorage();

    const invitation = await storage.getUserInvitation(req.params.id, req.header('x-correlation-id'));

    if (!invitation) {
      return res.status(404).send();
    }

    const user = await userAdapter.create(invitation.email, password, invitation.firstName, invitation.lastName, req.header('x-correlation-id'));

    return res.status(201).send(safeUser(user));
  } catch (e) {
    logger.error(e);
    res.status(500).send(e.message);
  }
};

module.exports = createUser;

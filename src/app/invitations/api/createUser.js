'use strict';

const logger = require('./../../../infrastructure/logger');
const InvitationStorage = require('./../data/redisInvitationStorage');
const config = require('./../../../infrastructure/config');
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

    const storage = new InvitationStorage();
    const userAdapter = UserStorage(config);

    const invitation = await storage.getUserInvitation(req.params.id, req.header('x-correlation-id'));

    if (!invitation) {
      return res.status(404).send();
    }

    const user = await userAdapter.create(invitation.email, password, invitation.firstName, invitation.lastName);

    return res.status(201).send(safeUser(user));
  } catch (e) {
    logger.error(e);
    res.status(500).send(e.message);
  }
};

module.exports = createUser;

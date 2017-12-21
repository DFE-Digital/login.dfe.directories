const Redis = require('ioredis');
const config = require('./../../../infrastructure/config');
const logger = require('./../../../infrastructure/logger');
const uuid = require('uuid/v4');

const client = new Redis(config.invitations.redisUrl);

const find = async (id) => {
  const result = await client.get(`UserInvitation_${id}`);
  if (!result) {
    return null;
  }
  const invitation = JSON.parse(result);
  return invitation || null;
};


const createInvitation = async (invitation) => {
  if (!invitation) {
    return null;
  }
  const id = uuid();
  const newInvitation = invitation;

  newInvitation.id = id;
  const content = JSON.stringify(newInvitation);

  await client.set(`UserInvitation_${id}`, content);
  return JSON.parse(content);
};

const deleteInvitationForUser = async (id) => {
  if (!id) {
    return null;
  }
  await client.del(`UserInvitation_${id}`);

  return '';
};


const getUserInvitation = async (id, correlationId) => {
  try {
    logger.info(`Get UserInvitation for request: ${correlationId}`);
    return await find(id);
  } catch (e) {
    logger.error(e);
    throw e;
  }
};

const createUserInvitation = async (invitation, correlationId) => {
  try {
    logger.info(`Creating UserInvitation for request: ${correlationId}`);
    return await createInvitation(invitation);
  } catch (e) {
    logger.error(e);
    throw e;
  }
};

const deleteInvitation = async (id) => {
  try {
    await deleteInvitationForUser(id);
  } catch (e) {
    logger.error(e);
    throw e;
  }
};


module.exports = {
  deleteInvitation,
  createUserInvitation,
  getUserInvitation,
};

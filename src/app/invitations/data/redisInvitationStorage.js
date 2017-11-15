const Redis = require('ioredis');
const config = require('./../../../infrastructure/config')();
const logger = require('./../../../infrastructure/logger');
const uuid = require('uuid/v4');

const find = async (id, client) => {
  const result = await client.get(`UserInvitation_${id}`);
  if (!result) {
    return null;
  }
  const invitation = JSON.parse(result);
  return invitation || null;
};


const createInvitation = async (invitation, client) => {
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

const deleteInvitation = async (id, client) => {
  if (!id) {
    return null;
  }
  await client.del(`UserInvitation_${id}`);
};

class RedisInvitationStorage {
  constructor(redisClient) {
    if (redisClient === null || redisClient === undefined) {
      this.client = new Redis(config.invitations.redisUrl);
    } else {
      this.client = redisClient;
    }
  }

  async getUserInvitation(id) {
    try {
      return await find(id, this.client);
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

  async createUserInvitation(invitation) {
    try {
      return await createInvitation(invitation, this.client);
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

  async deleteInvitation(id) {
    try {
      await deleteInvitation(id, this.client);
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }
}

module.exports = RedisInvitationStorage;

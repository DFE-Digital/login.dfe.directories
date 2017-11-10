const Redis = require('ioredis');
const config = require('./../../../infrastructure/config')();
const logger = require('./../../../infrastructure/logger');

const find = async (email, client) => {
  const result = await client.get(`UserInvitation_${email}`);
  if (!result) {
    return null;
  }
  const userCode = JSON.parse(result);
  return userCode || null;
};


const createInvitation = async (email, invitation, client) => {
  if (!invitation || !email) {
    return null;
  }

  const content = JSON.stringify(invitation);

  await client.set(`UserInvitation_${email}`, content);
  return content;
};

const deleteInvitation = async (email, client) => {
  if (!email) {
    return null;
  }
  await client.del(`UserInvitation_${email}`);
};

class RedisInvitationStorage {
  constructor(redisClient) {
    if (redisClient === null || redisClient === undefined) {
      this.client = new Redis(config.invitations.redisUrl);
    } else {
      this.client = redisClient;
    }
  }

  async getUserInvitation(email) {
    try {
      return await find(email, this.client);
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

  async createUserInvitation(email, invitation) {
    try {
      return await createInvitation(email, invitation, this.client);
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

  async deleteInvitation(email) {
    try {
      await deleteInvitation(email, this.client);
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }
}

module.exports = RedisInvitationStorage;

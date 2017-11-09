const Redis = require('ioredis');
const config = require('./../../../infrastructure/config')();
const logger = require('./../../../infrastructure/logger');

class RedisInvitationStorage {
  constructor(redisClient) {
    if (redisClient === null || redisClient === undefined) {
      this.client = new Redis(config.invitations.redisUrl);
    } else {
      this.client = redisClient;
    }
  }

  async getUserInvitation(email) {
  }

  async createUserInvitation(invitation) {

  }
}

module.exports = RedisInvitationStorage;
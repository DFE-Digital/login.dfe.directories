const Redis = require('ioredis');
const config = require('./../../../infrastructure/config');
const logger = require('./../../../infrastructure/logger');
const uuid = require('uuid/v4');
const { chunk } = require('lodash');

const tls = config.invitations.redisUrl.includes('6380');
const client = new Redis(config.invitations.redisUrl, { tls });

const list = async (pageNumber, pageSize) => {
  const allKeys = await new Promise((resolve, reject) => {
    const keys = [];
    client.scanStream({ match: 'UserInvitation_*' })
      .on('data', (batch) => {
        for (let i = 0; i < batch.length; i += 1) {
          keys.push(batch[i]);
        }
      })
      .on('end', () => {
        resolve(keys);
      })
      .on('error', reject);
  });

  const pagesOfKeys = chunk(allKeys, pageSize);
  if (pageNumber > pagesOfKeys.length) {
    return {
      invitations: [],
      page: pageNumber,
      numberOfPages: pagesOfKeys.length,
    };
  }

  const page = pagesOfKeys[pageNumber - 1];
  const invitations = await Promise.all(page.map(async (key) => {
    const result = await client.get(key);
    const invitation = JSON.parse(result);
    return invitation || null;
  }));

  return {
    invitations,
    page: pageNumber,
    numberOfPages: pagesOfKeys.length,
  };
};

const find = async (id) => {
  const result = await client.get(`UserInvitation_${id}`);
  if (!result) {
    return null;
  }
  const invitation = JSON.parse(result);
  return invitation || null;
};

const storeInvitation = async (invitation) => {
  const content = JSON.stringify(invitation);

  await client.set(`UserInvitation_${invitation.id}`, content);
  return JSON.parse(content);
};

const createInvitation = async (invitation) => {
  if (!invitation) {
    return null;
  }
  const id = uuid();
  const newInvitation = invitation;

  newInvitation.id = id;

  return await storeInvitation(newInvitation);
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
    logger.info(`Get UserInvitation for request: ${correlationId}`, { correlationId });
    return await find(id);
  } catch (e) {
    logger.error(`Get user invitation failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const createUserInvitation = async (invitation, correlationId) => {
  try {
    logger.info(`Creating UserInvitation for request: ${correlationId}`, { correlationId });
    return await createInvitation(invitation);
  } catch (e) {
    logger.error(`Create user invitation failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const deleteInvitation = async (id, correlationId) => {
  try {
    await deleteInvitationForUser(id);
  } catch (e) {
    logger.error(`Delete user invitation failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};

const updateInvitation = async (invitation, correlationId) => {
  try {
    await storeInvitation(invitation);
  } catch (e) {
    logger.error(`Update invitation failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};


module.exports = {
  list,
  deleteInvitation,
  createUserInvitation,
  getUserInvitation,
  updateInvitation,
};

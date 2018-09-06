const Redis = require('ioredis');
const config = require('./../../../infrastructure/config');
const logger = require('./../../../infrastructure/logger');
const uuid = require('uuid/v4');
const { chunk } = require('lodash');

const tls = config.invitations.redisUrl.includes('6380');
const client = new Redis(config.invitations.redisUrl, { tls });


const getAllKeys = async () => {
  return new Promise((resolve, reject) => {
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
};
const formatInvitation = (invitation) => {
  const defaultDate = new Date(Date.UTC(2018, 0, 1)).toISOString();
  const patched = Object.assign({
    createdAt: defaultDate,
    updatedAt: defaultDate,
  }, invitation);
  patched.createdAt = new Date(patched.createdAt);
  patched.updatedAt = new Date(patched.updatedAt);
  return patched;
};
const findInvitationsMatching = async (keys, maximumRequired, matcher) => {
  const matches = [];
  for (let i = 0; i < keys.length; i += 1) {
    const json = await client.get(keys[i]);
    const invitation = json ? formatInvitation(JSON.parse(json)) : null;
    if (invitation && matcher(invitation)) {
      matches.push(invitation);
      if (maximumRequired && maximumRequired > 0 && matches.length >= maximumRequired) {
        return matches;
      }
    }
  }
  return matches;
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
  const storable = Object.assign({ createdAt: new Date() }, invitation, { updatedAt: new Date() });
  const content = JSON.stringify(storable);

  await client.set(`UserInvitation_${invitation.id}`, content);
  return storable;
};

const createInvitation = async (invitation) => {
  if (!invitation) {
    return null;
  }
  const id = uuid();
  const newInvitation = invitation;

  newInvitation.id = id;

  return storeInvitation(newInvitation);
};


const list = async (pageNumber, pageSize, changedAfter = undefined) => {
  const allKeys = await getAllKeys();
  let invitations = [];
  let numberOfPages = 0;

  if (changedAfter) {
    const allMatchingInvitations = await findInvitationsMatching(allKeys, undefined, (invitation) => {
      return invitation.updatedAt.getTime() >= changedAfter.getTime();
    });
    const pagesOfInvitations = chunk(allMatchingInvitations, pageSize);
    numberOfPages = pagesOfInvitations.length;
    if (pageNumber <= pagesOfInvitations.length) {
      invitations = pagesOfInvitations[pageNumber - 1];
    }
  } else {
    const pagesOfKeys = chunk(allKeys, pageSize);
    numberOfPages = pagesOfKeys.length;
    if (pageNumber <= pagesOfKeys.length) {
      invitations = await findInvitationsMatching(pagesOfKeys[pageNumber - 1], pageSize, () => true);
    }
  }

  return {
    invitations,
    page: pageNumber,
    numberOfPages,
  };
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

const findInvitationForEmail = async (email, excludeComplete, correlationId) => {
  try {
    logger.info(`Find UserInvitations for request: ${correlationId}`, { correlationId });

    const allKeys = await getAllKeys();
    for (let i = 0; i < allKeys.length; i += 1) {
      const json = await client.get(allKeys[i]);
      const invitation = json ? JSON.parse(json) : null;
      if (invitation && invitation.email && invitation.email.toLowerCase() === email.toLowerCase()
        && (!excludeComplete || !invitation.isCompleted)) {
        return invitation;
      }
    }
    return null;
  } catch (e) {
    logger.error(`Find UserInvitations failed for request ${correlationId} error: ${e}`, { correlationId });
    throw e;
  }
};


module.exports = {
  list,
  deleteInvitation,
  createUserInvitation,
  getUserInvitation,
  updateInvitation,
  findInvitationForEmail,
};

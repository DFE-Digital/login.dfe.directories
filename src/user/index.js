const assert = require('assert');
const UserMongoAdapter = require('./UserMongoAdapter');
const UserRedisAdapter = require('./UserRedisAdapter');
const UserFileAdapter = require('./UserFileAdapter');
const UserAzureActiveDirectoryAdapter = require('./UserAzureActiveDirectoryAdapter');


const getUserAdapter = (config, direcotryId) => {
  const userAdapterType = config.adapters.find(id => id.id === direcotryId);
  if (userAdapterType === null || userAdapterType === undefined) {
    return null;
  }

  if (userAdapterType.type === 'file') {
    return new UserFileAdapter();
  }
  if (userAdapterType.type === 'redis') {
    assert(userAdapterType.params.redisurl, 'redisurl is required');
    return new UserRedisAdapter(undefined, userAdapterType.params);
  }
  if (userAdapterType.type === 'mongo') {
    assert(userAdapterType.params.mongoConnection, 'mongo connection url is required');
    return new UserMongoAdapter(userAdapterType.params);
  }
  if (userAdapterType.type === 'azuread') {
    assert(userAdapterType.params.url, 'url is required');
    assert(userAdapterType.params.baseDN, 'baseDN is required');
    assert(userAdapterType.params.password, 'password is required');
    assert(userAdapterType.params.username, 'username is required');
    return new UserAzureActiveDirectoryAdapter(userAdapterType.params);
  }
  return null;
};

module.exports = getUserAdapter;

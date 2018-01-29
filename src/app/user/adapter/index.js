const assert = require('assert');
const config = require('./../../../infrastructure/config');

const getUserAdapter = () => {
  const userAdapterType = config.adapter;
  if (userAdapterType === null || userAdapterType === undefined) {
    return null;
  }

  if (userAdapterType.type === 'sequelize') {
    return require('./UserSequelizeAdapter');
  }

  if (userAdapterType.type === 'file') {
    return require('./UserFileAdapter');
  }
  if (userAdapterType.type === 'redis') {
    assert(userAdapterType.params.redisurl, 'redisurl is required');
    return require('./UserRedisAdapter');
  }
  if (userAdapterType.type === 'azuread') {
    assert(userAdapterType.params.url, 'url is required');
    assert(userAdapterType.params.baseDN, 'baseDN is required');
    assert(userAdapterType.params.password, 'password is required');
    assert(userAdapterType.params.username, 'username is required');
    return require('./UserAzureActiveDirectoryAdapter');
  }
  return null;
};

module.exports = getUserAdapter();

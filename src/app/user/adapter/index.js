const assert = require('assert');
const config = require('./../../../infrastructure/config');
const UserRedisAdapter = require('./UserRedisAdapter');
const UserFileAdapter = require('./UserFileAdapter');
const UserAzureActiveDirectoryAdapter = require('./UserAzureActiveDirectoryAdapter');


const getUserAdapter = () => {
  const userAdapterType = config.adapter;
  if (userAdapterType === null || userAdapterType === undefined) {
    return null;
  }

  if (userAdapterType.type === 'sequelize') {
    return require('./UserSequelizeAdapter');
  }

  if (userAdapterType.type === 'file') {
    return UserFileAdapter;
  }
  if (userAdapterType.type === 'redis') {
    assert(userAdapterType.params.redisurl, 'redisurl is required');
    return UserRedisAdapter;
  }
  if (userAdapterType.type === 'azuread') {
    assert(userAdapterType.params.url, 'url is required');
    assert(userAdapterType.params.baseDN, 'baseDN is required');
    assert(userAdapterType.params.password, 'password is required');
    assert(userAdapterType.params.username, 'username is required');
    return UserAzureActiveDirectoryAdapter;
  }
  return null;
};

module.exports = getUserAdapter();

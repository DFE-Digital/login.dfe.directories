const assert = require('assert');
const userMongoAdapter = require('./UserMongoAdapter');
const userRedisAdapter = require('./UserRedisAdapter');
const userFileAdapter = require('./UserFileAdapter');
const userAzureActiveDirectoryAdapter = require('./UserAzureActiveDirectoryAdapter');


const getUserAdapter = (config, uuid) => {
  const userAdapterType = config.adapters.find((id) => id.uuid === uuid);
  if (userAdapterType === null || userAdapterType === undefined) {
    return null;
  }


  if(userAdapterType.type === 'file'){
    return new userFileAdapter();
  }
  if(userAdapterType.type === 'redis'){
    assert(config.redisurl, 'redisurl is required');
    return new userRedisAdapter();
  }
  if(userAdapterType.type === 'mongo'){
    assert(config.mongoConnection, 'mongo connection url is required');
    return new userMongoAdapter();
  }
  if(userAdapterType.type === 'azuread'){
    assert(config.ldapConfiguration.url,'ldapConfiguration.url is required');
    assert(config.ldapConfiguration.baseDN,'ldapConfiguration.baseDN is required');
    assert(config.ldapConfiguration.password,'ldapConfiguration.password is required');
    assert(config.ldapConfiguration.username,'ldapConfiguration.username is required');
    return new userAzureActiveDirectoryAdapter();
  }

};

module.exports = getUserAdapter;
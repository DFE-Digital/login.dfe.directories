const assert = require('assert');
const userMongoAdapter = require('./UserMongoAdapter');
const userRedisAdapter = require('./UserRedisAdapter');
const userFileAdapter = require('./UserFileAdapter');
const userAzureActiveDirectoryAdapter = require('./UserAzureActiveDirectoryAdapter');


const getUserAdapter = (config, direcotryId) => {
  const userAdapterType = config.adapters.find((id) => id.id === direcotryId);
  if (userAdapterType === null || userAdapterType === undefined) {
    return null;
  }

  if(userAdapterType.type === 'file'){
    return new userFileAdapter();
  }
  if(userAdapterType.type === 'redis'){
    assert(userAdapterType.params.redisurl, 'redisurl is required');
    return new userRedisAdapter(undefined, userAdapterType.params);
  }
  if(userAdapterType.type === 'mongo'){
    assert(userAdapterType.params.mongoConnection, 'mongo connection url is required');
    return new userMongoAdapter(userAdapterType.params);
  }
  if(userAdapterType.type === 'azuread'){
    assert(userAdapterType.params.url,'url is required');
    assert(userAdapterType.params.baseDN,'baseDN is required');
    assert(userAdapterType.params.password,'password is required');
    assert(userAdapterType.params.username,'username is required');
    return new userAzureActiveDirectoryAdapter(userAdapterType.params);
  }

};

module.exports = getUserAdapter;
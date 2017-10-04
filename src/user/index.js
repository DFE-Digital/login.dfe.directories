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

  assert(config.RequestVerificationCertification, 'The certificate location for requestverification must be provided');

  if(userAdapterType.type === 'file'){
    return new userFileAdapter();
  }
  if(userAdapterType.type === 'redis'){
    assert(config.redisurl, 'redisurl is required');
    return new userRedisAdapter(undefined, config);
  }
  if(userAdapterType.type === 'mongo'){
    assert(config.mongoConnection, 'mongo connection url is required');
    return new userMongoAdapter(config);
  }
  if(userAdapterType.type === 'azuread'){
    assert(config.ldapConfiguration.url,'ldapConfiguration.url is required');
    assert(config.ldapConfiguration.baseDN,'ldapConfiguration.baseDN is required');
    assert(config.ldapConfiguration.password,'ldapConfiguration.password is required');
    assert(config.ldapConfiguration.username,'ldapConfiguration.username is required');
    return new userAzureActiveDirectoryAdapter(config);
  }

};

module.exports = getUserAdapter;
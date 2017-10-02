const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const UserIndex = require('../../src/user/index');
const UserFileAdapter = require('../../src/user/UserFileAdapter');
const UserMongoAdapter = require('../../src/user/UserMongoAdapter');
const UserRedisAdapter = require('../../src/user/UserRedisAdapter');
const UserAzureActiveDirectoryAdapter = require('../../src/user/UserAzureActiveDirectoryAdapter');


describe('When constructing the User index', () => {

  const configStub = {adapters:
    [{
      uuid: '8850a16c-4258-4d69-86b7-95b69cd5cd15',
      type: 'file',
      expectedAdapter: UserFileAdapter
    },{
      uuid: 'ff080eff-b525-4215-a11f-f5b37eefad45',
      type: 'mongo',
      expectedAdapter: UserMongoAdapter
    },{
      uuid: '9af9f8a2-ceec-461f-8db4-ff37073903df',
      type: 'redis',
      expectedAdapter: UserRedisAdapter
    },{
      uuid: '76841484-ba65-4195-ab73-9571cae5d4ca',
      type: 'azuread',
      expectedAdapter: UserAzureActiveDirectoryAdapter
    }],redisurl: 'testurl',mongoConnection:'testmongoconnection',RequestVerificationCertification: 'cert',
    ldapConfiguration:{
      url:'test',
      baseDN:'base',
      username:'user',
      password:'password'
    }};

  it('then the UserAdapater is found based on the uuid', ()=>{
    const assertStub = function() {
      return true;
    };
    const userIndex = proxyquire('../../src/user/index', {'assert': assertStub});

    configStub.adapters.map((adapter) =>{
      return expect(userIndex(configStub, adapter.uuid)).to.be.an.instanceOf(adapter.expectedAdapter);
    });
  })
  it('then if there is no adapter found null is returned', () => {
    const actual = UserIndex(configStub, '8850a16c-4258-4d69-86b7');

    expect(actual).to.equal(null);
  })
  it('then if the config is missing for the required adapter an assertion is thrown', () =>{
    configStub.adapters.map((adapter) =>{
      return expect(UserIndex(configStub, adapter.uuid)).to.be.an.instanceOf(adapter.expectedAdapter);
    });
  })
});
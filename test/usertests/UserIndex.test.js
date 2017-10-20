const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const UserIndex = require('../../src/user/adapter/index');
const UserRedisAdapter = require('../../src/user/adapter/UserRedisAdapter');


describe('When constructing the User index', () => {

  const configStub = {
    adapter:
      {
        id: '9af9f8a2-ceec-461f-8db4-ff37073903df',
        type: 'redis',
        expectedAdapter: UserRedisAdapter,
        params: {
          redisurl: 'testurl',
        },
    }
  };
  it('then the UserAdapater is found based on the config', () => {
    const assertStub = function () {
      return true;
    };
    const userIndex = proxyquire('../../src/user/index', {'assert': assertStub});

    expect(userIndex(configStub)).to.be.an.instanceOf(UserRedisAdapter);
  });
  it('then if there is no adapter found null is returned', () => {
    const actual = UserIndex({adapter:{}});

    expect(actual).to.equal(null);
  });
  it('then if the config is missing for the required adapter an assertion is thrown', () => {
    let assertion = false;
    const assertStub = function (paramVal) {
      if(paramVal === '') {
        assertion = true;
      }
    };
    configStub.adapter.params.redisurl = '';
    const userIndex = proxyquire('../../src/user/index', {'assert': assertStub});

    userIndex(configStub);

    expect(assertion).to.equal(true);
  })
});
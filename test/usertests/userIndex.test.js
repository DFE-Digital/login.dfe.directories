jest.mock('assert');
jest.mock('./../../src/infrastructure/config', () => ({ params: {
  redisurl: 'http://orgs.api.test',
} }));
jest.mock('ioredis', () => jest.fn().mockImplementation(() => {

}));
jest.mock('./../../src/app/user/adapter/UserRedisAdapter');


jest.mock('./../../src/infrastructure/config', () => (
  {
    adapter: {
      id: '9af9f8a2-ceec-461f-8db4-ff37073903df',
      type: 'redis',
      expectedAdapter: require('./../../src/app/user/adapter/UserRedisAdapter'),
      params: {
        redisurl: 'testurl',
      },
    },
  }));

const UserRedisAdapter = require('./../../src/app/user/adapter/UserRedisAdapter');


describe('When constructing the User index', () => {
  it('then the UserAdapater is found based on the config', () => {
    const UserIndex = require('./../../src/app/user/adapter');
    expect(UserIndex).toBe(UserRedisAdapter);
  });
  it('then if there is no adapter found null is returned', () => {
    jest.resetModules();
    jest.doMock('./../../src/infrastructure/config', () => (
      {
        adapter: { },
      }));

    const UserIndex = require('./../../src/app/user/adapter');
    const actual = UserIndex;

    expect(actual).toBeNull();
  });
  it('then if the config is missing for the required adapter an assertion is thrown', () => {
    jest.resetModules();
    jest.doMock('./../../src/infrastructure/config', () => (
      {
        adapter: {
          id: '9af9f8a2-ceec-461f-8db4-ff37073903df',
          type: 'redis',
          expectedAdapter: require('./../../src/app/user/adapter/UserRedisAdapter'),
          params: {
            redisurl: '',
          },
        },
      }));
    const assert = require('assert');
    let assertion = false;
    assert.mockImplementation((paramVal) => {
      if (paramVal === '') {
        assertion = true;
      }
    });

    const UserIndex = require('./../../src/app/user/adapter');
    UserIndex;

    expect(assertion).toBe(true);
  });
});

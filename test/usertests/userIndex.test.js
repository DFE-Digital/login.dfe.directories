jest.mock('assert');

const UserIndex = require('./../../src/app/user/adapter');
const UserRedisAdapter = require('./../../src/app/user/adapter/UserRedisAdapter');



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
    expect(UserIndex(configStub)).toBeInstanceOf(UserRedisAdapter);
  });
  it('then if there is no adapter found null is returned', () => {
    const actual = UserIndex({adapter:{}});

    expect(actual).toEqual(null);
  });
  it('then if the config is missing for the required adapter an assertion is thrown', () => {
    let assert = require('assert');
    let assertion = false;
    assert.mockImplementation((paramVal) => {
        if(paramVal === '') {
          assertion = true;
        }
    });
    configStub.adapter.params.redisurl = '';

    UserIndex(configStub);

    expect(assertion).toEqual(true);
  })
});
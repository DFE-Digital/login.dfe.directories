const expect = require('chai').expect;
const RedisMock = require('ioredis-mock').default;
const userCodeStorage = require('../../src/userCodes/RedisUserCodeStorage');


describe('When using redis user code storage', () => {
  describe('then when I call GetUserPasswordResetCode', () => {
    let redis;
    let userStorage;

    beforeEach(() => {

      redis = new RedisMock();
      redis.disconnect = () => {};
      userStorage = new userCodeStorage(redis);
    });
    it('then null is returned if the code does not exist for the user', async () => {
      const actual = await userStorage.GetUserPasswordResetCode('123');

      expect(actual).to.equal(null);
    });
    it('then the code is returned with the userid if it exists', async () => {
      redis.set('UserResetCode_123','{"uid":"123","code":"ABC123"}');

      const actual = await userStorage.GetUserPasswordResetCode('123');

      expect(actual).to.not.equal(null);
      expect(actual.code).to.equal('ABC123');
    });
  })
});
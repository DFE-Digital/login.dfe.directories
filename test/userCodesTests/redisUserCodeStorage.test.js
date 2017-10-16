const expect = require('chai').expect;
const RedisMock = require('ioredis-mock').default;
const userCodeStorage = require('../../src/userCodes/redisUserCodeStorage');
const proxyquire = require('proxyquire');

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
      const actual = await userStorage.getUserPasswordResetCode('123');

      expect(actual).to.equal(null);
    });
    it('then the code is returned with the userid if it exists', async () => {
      redis.set('UserResetCode_123','{"uid":"123","code":"ABC123"}');

      const actual = await userStorage.getUserPasswordResetCode('123');

      expect(actual).to.not.equal(null);
      expect(actual.code).to.equal('ABC123');
    });
  });
  describe('then when i call createUserPasswordResetCode', () => {
    let redis;
    let userStorage;

    beforeEach(() => {

      redis = new RedisMock();
      redis.disconnect = () => {};
      userStorage = new userCodeStorage(redis);
    });
    it('then the uid is used to create the record',async () => {
      await userStorage.createUserPasswordResetCode('321');
      var record = await redis.get('UserResetCode_321');

      expect(record).to.not.equal(null);
    });
    it('then if the uid is not supplied then a record is not created',async () => {
      const actual = await userStorage.createUserPasswordResetCode();

      expect(actual).to.equal(null);
    });
    it('then the code is set from the code generation tool', async ()=>{

      const redisStorage =  proxyquire('../../src/userCodes/redisUserCodeStorage', {
        './generateResetCode': () => {
          return 'ABC123';
        },
      });
      const storage = new redisStorage(redis);

      const actual = await storage.createUserPasswordResetCode('321');

      expect(actual.code).to.equal('ABC123');
    });
  });
  describe('then when i call deleteUserPasswordResetCode', () => {
    let redis;
    let userStorage;

    beforeEach(() => {
      redis = new RedisMock();
      redis.disconnect = () => {};
      userStorage = new userCodeStorage(redis);
    });
    it('then if the uid is not supplied the record is not deleted', async () => {
      redis.set('UserResetCode_123','{"uid":"123","code":"ABC123"}');

      await userStorage.deleteUserPasswordResetCode();

      var record = await redis.get('UserResetCode_123');
      expect(record).to.not.equal(null);
    });
    it('then the uid is used to find the record and delete it', async ()=> {
      redis.set('UserResetCode_123','{"uid":"123","code":"ABC123"}');

      await userStorage.deleteUserPasswordResetCode('123');

      var record = await redis.get('UserResetCode_123');
      expect(record).to.equal(null);
    });

  });
});
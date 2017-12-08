jest.mock('./../../src/app/userCodes/utils/generateResetCode');
jest.mock('./../../src/infrastructure/config');

const RedisMock = require('ioredis-mock').default;

describe('When using redis user code storage', () => {
  const redis = new RedisMock();
  let generateResetCode;
  let config;
  let configStub;
  let userStorage;

  beforeEach(() => {
    generateResetCode = require('./../../src/app/userCodes/utils/generateResetCode');
    generateResetCode.mockImplementation(() => 'ABC123');

    configStub = jest.fn().mockImplementation(() => ({
      userCodes: {staticCode: false},
    }));

    config = require('./../../src/infrastructure/config');
    config.mockImplementation(configStub);

    const userCodeStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
    userStorage = new userCodeStorage(redis);
  });
  describe('then when I call GetUserPasswordResetCode', () => {
    it('then null is returned if the code does not exist for the user', async () => {
      const actual = await userStorage.getUserPasswordResetCode('123');

      expect(actual).toBeNull();
    });
    it('then the code is returned with the userid if it exists', async () => {
      redis.set('UserResetCode_123', '{"uid":"123","code":"ABC123"}');

      const actual = await userStorage.getUserPasswordResetCode('123');

      expect(actual).not.toBeNull();
      expect(actual.code).toBe('ABC123');
    });
    it('then if there is a record against the user id it is returned', async () => {
      redis.set('UserResetCode_123', '{"uid":"123","code":"ABC123", "redirectUri":"http://localhost.test"}');

      const actual = await userStorage.getUserPasswordResetCode('123');

      expect(actual).not.toBeNull();
      expect(actual.uid).toBe('123');
      expect(actual.code).toBe('ABC123');
      expect(actual.redirectUri).toBe('http://localhost.test');
    });
  });
  describe('then when i call createUserPasswordResetCode', () => {
    it('then the uid is used to create the record and properties stored against the record', async () => {
      await userStorage.createUserPasswordResetCode('321', 'client1', 'http://local.test');
      const record = await redis.get('UserResetCode_321');

      expect(record).not.toBeNull();
      const resetCode = JSON.parse(record);
      expect(resetCode.clientId).toBe('client1');
      expect(resetCode.uid).toBe('321');
      expect(resetCode.code).toBe('ABC123');
      expect(resetCode.redirectUri).toBe('http://local.test');
    });
    it('then if the uid is not supplied then a record is not created', async () => {
      const actual = await userStorage.createUserPasswordResetCode();

      expect(actual).toBeNull();
    });
    it('then the code is set from the code generation tool', async () => {
      const actual = await userStorage.createUserPasswordResetCode('321', 'client1', 'http://local.test');

      expect(actual.code).toBe('ABC123');
    });
    it('then a static code is returned if the config is set', async () => {
      jest.resetModules();
      generateResetCode = require('./../../src/app/userCodes/utils/generateResetCode');
      generateResetCode.mockImplementation(() => 'XYZ123');

      config = require('./../../src/infrastructure/config');
      configStub = jest.fn().mockImplementation(() => ({
        userCodes: {staticCode: true},
      }));

      config.mockImplementation(configStub);

      const actual = await userStorage.createUserPasswordResetCode('321', 'client1', 'http://local.test');

      expect(actual.code).toBe('ABC123');
    });
  });
  describe('then when i call deleteUserPasswordResetCode', () => {
    it('then if the uid is not supplied the record is not deleted', async () => {
      redis.set('UserResetCode_123', '{"uid":"123","code":"ABC123"}');

      await userStorage.deleteUserPasswordResetCode();

      const record = await redis.get('UserResetCode_123');
      expect(record).not.toBeNull();
    });
    it('then the uid is used to find the record and delete it', async () => {
      redis.set('UserResetCode_123', '{"uid":"123","code":"ABC123"}');

      await userStorage.deleteUserPasswordResetCode('123');

      const record = await redis.get('UserResetCode_123');
      expect(record).toBeNull();
    });
  });
});

jest.mock('./../../src/app/userCodes/utils/generateResetCode');
jest.mock('./../../src/infrastructure/config', () => ({
  userCodes: { staticCode: false },
  redis: {
    url: 'http://orgs.api.test',
  },
}));

jest.mock('ioredis', () => jest.fn().mockImplementation(() => {

}));


describe('When using redis user code storage', () => {
  let generateResetCode;
  let userCodeStorage;

  beforeEach(() => {
    jest.resetModules();
    generateResetCode = require('./../../src/app/userCodes/utils/generateResetCode');
    generateResetCode.mockImplementation(() => 'ABC123');
  });
  describe('then when I call GetUserPasswordResetCode', () => {
    it('then null is returned if the code does not exist for the user', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
      const actual = await userCodeStorage.getUserPasswordResetCode('123');

      expect(actual).toBeNull();
    });
    it('then the code is returned with the userid if it exists', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('UserResetCode_123', '{"uid":"123","code":"ABC123"}');
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
      const actual = await userCodeStorage.getUserPasswordResetCode('123');

      expect(actual).not.toBeNull();
      expect(actual.code).toBe('ABC123');
    });
    it('then if there is a record against the user id it is returned', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('UserResetCode_123', '{"uid":"123","code":"ABC123", "redirectUri":"http://localhost.test"}');
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
      const actual = await userCodeStorage.getUserPasswordResetCode('123');

      expect(actual).not.toBeNull();
      expect(actual.uid).toBe('123');
      expect(actual.code).toBe('ABC123');
      expect(actual.redirectUri).toBe('http://localhost.test');
    });
  });
  describe('then when i call createUserPasswordResetCode', () => {
    it('then the uid is used to create the record and properties stored against the record', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
      await userCodeStorage.createUserPasswordResetCode('321', 'client1', 'http://local.test');
      const record = await userCodeStorage.getUserPasswordResetCode('321');

      expect(record).not.toBeNull();
      expect(record.clientId).toBe('client1');
      expect(record.uid).toBe('321');
      expect(record.code).toBe('ABC123');
      expect(record.redirectUri).toBe('http://local.test');
    });
    it('then if the uid is not supplied then a record is not created', async () => {

      userCodeStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
      const actual = await userCodeStorage.createUserPasswordResetCode();

      expect(actual).toBeNull();
    });
    it('then the code is set from the code generation tool', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
      const actual = await userCodeStorage.createUserPasswordResetCode('321', 'client1', 'http://local.test');

      expect(actual.code).toBe('ABC123');
    });
    it('then a static code is returned if the config is set', async () => {
      jest.resetModules();
      generateResetCode = require('./../../src/app/userCodes/utils/generateResetCode');
      generateResetCode.mockImplementation(() => 'XYZ123');
      jest.doMock('./../../src/infrastructure/config', () => ({
        userCodes: { staticCode: true },
        redis: { url: 'http://orgs.api.test' },
      }));
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
      const actual = await userCodeStorage.createUserPasswordResetCode('321', 'client1', 'http://local.test');

      expect(actual.code).toBe('ABC123');
    });
  });
  describe('then when i call deleteUserPasswordResetCode', () => {
    it('then if the uid is not supplied the record is not deleted', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('UserResetCode_123', '{"uid":"123","code":"ABC123"}');
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
      await userCodeStorage.deleteUserPasswordResetCode();

      const record = await userCodeStorage.getUserPasswordResetCode('123');
      expect(record).not.toBeNull();
    });
    it('then the uid is used to find the record and delete it', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('UserResetCode_123', '{"uid":"123","code":"ABC123"}');
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
      await userCodeStorage.deleteUserPasswordResetCode('123');

      const record = await userCodeStorage.getUserPasswordResetCode('123');
      expect(record).toBeNull();
    });
  });
});

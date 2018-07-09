jest.mock('./../../src/app/userCodes/utils/generateResetCode');
jest.mock('./../../src/infrastructure/config', () => ({
  userCodes: {
    type: 'redis',
    params: {
      redisUrl: 'http://orgs.api.test',
    },
  },

}));

jest.mock('ioredis', () => jest.fn().mockImplementation(() => {

}));
jest.mock('./../../src/infrastructure/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
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
        const RedisMock = require('ioredis-mock');
        const redisMock = new RedisMock();
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data');
      const actual = await userCodeStorage.getUserCode('123', 'PasswordReset');

      expect(actual).toBeNull();
    });
    it('then the code is returned with the userid if it exists', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock');
        const redisMock = new RedisMock();
        redisMock.set('UserResetCode_123_passwordreset', '{"uid":"123","code":"ABC123", "codeType":"PasswordReset"}');
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data');
      const actual = await userCodeStorage.getUserCode('123', 'PasswordReset');

      expect(actual).not.toBeNull();
      expect(actual.code).toBe('ABC123');
    });
    it('then if there is a record against the user id it is returned', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock');
        const redisMock = new RedisMock();
        redisMock.set('UserResetCode_123_passwordreset', '{"uid":"123","code":"ABC123", "redirectUri":"http://localhost.test"}');
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data');
      const actual = await userCodeStorage.getUserCode('123', 'PasswordReset');

      expect(actual).not.toBeNull();
      expect(actual.uid).toBe('123');
      expect(actual.code).toBe('ABC123');
      expect(actual.redirectUri).toBe('http://localhost.test');
    });
  });
  describe('then when i call createUserPasswordResetCode', () => {
    it('then the uid is used to create the record and properties stored against the record', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock');
        const redisMock = new RedisMock();
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data');
      await userCodeStorage.createUserCode('321', 'client1', 'http://local.test', undefined, undefined, 'PasswordReset');
      const record = await userCodeStorage.getUserCode('321', 'PasswordReset');

      expect(record).not.toBeNull();
      expect(record.clientId).toBe('client1');
      expect(record.uid).toBe('321');
      expect(record.code).toBe('ABC123');
      expect(record.redirectUri).toBe('http://local.test');
    });
    it('then if the uid is not supplied then a record is not created', async () => {
      userCodeStorage = require('./../../src/app/userCodes/data');
      const actual = await userCodeStorage.createUserCode();

      expect(actual).toBeNull();
    });
    it('then the code is set from the code generation tool', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock');
        const redisMock = new RedisMock();
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data');
      const actual = await userCodeStorage.createUserCode('321', 'client1', 'http://local.test', undefined, undefined, 'PasswordReset');

      expect(actual.code).toBe('ABC123');
    });
    it('then a static code is returned if the config is set', async () => {
      jest.resetModules();
      generateResetCode = require('./../../src/app/userCodes/utils/generateResetCode');
      generateResetCode.mockImplementation(() => 'XYZ123');
      jest.doMock('./../../src/infrastructure/config', () => ({
        userCodes: {
          type: 'static',
          params: {
            redisUrl: 'http://orgs.api.test',
          },
        },
      }));
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock');
        const redisMock = new RedisMock();
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data');
      const actual = await userCodeStorage.createUserCode('321', 'client1', 'http://local.test');

      expect(actual.code).toBe('ABC123');
    });
  });
  describe('then when i call deleteUserPasswordResetCode', () => {
    it('then if the uid is not supplied the record is not deleted', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock');
        const redisMock = new RedisMock();
        redisMock.set('UserResetCode_123_passwordreset', '{"uid":"123","code":"ABC123"}');
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data');
      await userCodeStorage.deleteUserCode();

      const record = await userCodeStorage.getUserCode('123', 'PasswordReset');
      expect(record).not.toBeNull();
    });
    it('then the uid is used to find the record and delete it', async () => {
      jest.doMock('./../../src/infrastructure/config', () => ({
        userCodes: {
          type: 'redis',
          params: {
            redisUrl: 'http://orgs.api.test',
          },
        },
      }));
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock');
        const redisMock = new RedisMock();
        redisMock.set('UserResetCode_123_passwordreset', '{"uid":"123","code":"ABC123"}');
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data');
      await userCodeStorage.deleteUserCode('123', 'PasswordReset');

      const record = await userCodeStorage.getUserCode('123', 'PasswordReset');
      expect(record).toBeNull();
    });
  });
  describe('then when i call updateUserPasswordResetCode', () => {
    it('then if the record is not found null is returned', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock');
        const redisMock = new RedisMock();
        redisMock.set('UserResetCode_123_passwordreset', '{"uid":"123","code":"ABC123"}');
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data');

      const record = await userCodeStorage.updateUserCode('321', '', '', '', '', '', 'PasswordReset');
      expect(record).toBeNull();
    });

    it('then if the record is found the the values are updated', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock');
        const redisMock = new RedisMock();
        redisMock.set('UserResetCode_123_passwordreset', '{"uid":"123","code":"ZXY123", "email":"test@local", "codeType": "PasswordReset"}');
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data');

      const record = await userCodeStorage.updateUserCode('123', 'test@local', { something: 'test' }, '', '', '', 'PasswordReset');
      expect(record).not.toBeNull();
      expect(record.code).toBe('ZXY123');
      expect(record.contextData).toBe('{\"something\":\"test\"}');
    });

    it('then if the email is different a new code is generated', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock');
        const redisMock = new RedisMock();
        redisMock.set('UserResetCode_123_passwordreset', '{"uid":"123","code":"ZXY123", "email":"test@local", "codeType": "PasswordReset"}');
        return redisMock;
      }));

      userCodeStorage = require('./../../src/app/userCodes/data');

      const record = await userCodeStorage.updateUserCode('123', 'test@local2', '', '', '', '', 'PasswordReset');
      expect(record).not.toBeNull();
      expect(record.code).toBe('ABC123');
    });
  });
});

'use strict';

jest.mock('./../../src/infrastructure/config', () => (
  {
    adapter: {
      params: {
        redisurl: 'http://orgs.api.test',
      },
    },
  }));

jest.mock('ioredis', () => jest.fn().mockImplementation(() => {

}));
jest.mock('./../../src/infrastructure/logger', () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

let userStorage = require('./../../src/app/user/adapter/UserRedisAdapter');
const { promisify } = require('util');

const crypto = require('crypto');

describe('When using redis storage service', () => {
  describe('then when I call find', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('the user are retrieved from redis', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('User_test@localuser.com', '{"sub": "12345"}');
        redisMock.set('User_12345', '{"sub": "test@localuser.com"}');
        return redisMock;
      }));

      userStorage = require('./../../src/app/user/adapter/UserRedisAdapter');
      const actual = await userStorage.findByUsername('test@localuser.com');

      expect(actual).not.toBeUndefined();
      expect(JSON.stringify(actual)).toBe('{"sub":"test@localuser.com"}');
    });
    it('then null is returned if there is no data', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        return redisMock;
      }));

      userStorage = require('./../../src/app/user/adapter/UserRedisAdapter');
      const actual = await userStorage.findByUsername('test@localuser.com');

      expect(actual).toBeNull();
    });
    it('then the json is parsed and returned', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('User_test3@localuser.com', '{"sub": "12345"}');
        redisMock.set('User_12345', '{"sub": "test3@localuser.com","email":"test3@localuser.com", "first_name": "Tester", "last_name" : "Testing"}');
        return redisMock;
      }));

      userStorage = require('./../../src/app/user/adapter/UserRedisAdapter');
      const actual = await userStorage.findByUsername('test3@localuser.com');

      expect(actual).not.toBeNull();
      expect(actual.first_name).toBe('Tester');
    });
    it('then if the user is not found then null is returned', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('User_test4@localuser.com', '{"sub": "54321"}');
        redisMock.set('User_12345', '{"sub": "test3@localuser.com","email":"test3@localuser.com", "first_name": "Tester", "last_name" : "Testing"}');
        return redisMock;
      }));

      userStorage = require('./../../src/app/user/adapter/UserRedisAdapter');
      const actual = await userStorage.findByUsername('test4@localuser.com');

      expect(actual).toBeNull();
    });
  });
  describe('then when I call change password', () => {
    let redis;
    let userStorage;

    beforeEach(() => {
      jest.resetModules();
    });
    it('if the user does not exist false is returned', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('User_test3@localuser.com', '[{"sub": "test@localuser.com"}]');
        return redisMock;
      }));

      userStorage = require('./../../src/app/user/adapter/UserRedisAdapter');
      const actual = await userStorage.changePassword('test@localuser.com', 'my-new-password');

      expect(actual).toBe(false);
    });
    it('if the user exists the record is updated', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('User_test3@localuser.com', '{"sub": "test3@localuser.com","email":"test3@localuser.com", "first_name": "Tester", "last_name" : "Testing", "salt":"123456768"}');
        return redisMock;
      }));

      userStorage = require('./../../src/app/user/adapter/UserRedisAdapter');
      const actual = await userStorage.changePassword('test3@localuser.com', 'my-new-password');

      expect(actual).toBe(true);
      const findResult = await userStorage.find('test3@localuser.com');
      expect(findResult).not.toBeNull();
      const request = promisify(crypto.pbkdf2);
      const saltBuffer = Buffer.from(findResult.salt, 'utf8');
      const derivedKey = await request('my-new-password', saltBuffer, 10000, 512, 'sha512');
      expect(findResult.password).toBe(derivedKey.toString('base64'));
    });
  });
  describe('then when i call create', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('null is returned if no username and/or password is specified', async () => {
      const username = null;
      const password = null;
      const firstName = null;
      const lastName = null;

      userStorage = require('./../../src/app/user/adapter/UserRedisAdapter');
      const actual = await userStorage.create(username, password, firstName, lastName);

      expect(actual).toBeNull();
    });

    it('returns an existing user if the username already exists', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('User_test3@localuser.com', '{"sub": "12345"}');
        redisMock.set('User_12345', '{"sub": "12345","email":"test3@localuser.com", "first_name": "Tester", "last_name" : "Testing"}');
        return redisMock;
      }));

      const username = 'test3@localuser.com';
      const password = 'password';
      const firstName = 'Bill';
      const lastName = 'Shankley';

      userStorage = require('./../../src/app/user/adapter/UserRedisAdapter');
      const actual = await userStorage.create(username, password, firstName, lastName);

      expect(actual).not.toBeNull();
      expect(actual.sub).toBe('12345');
    });
  });
  describe('then when i call get users by ids', () => {
    beforeEach(() => {
      jest.resetModules();
    });
    it('null is returned if the userIds are not supplied', async () => {
      const userIds = null;

      userStorage = require('./../../src/app/user/adapter/UserRedisAdapter');
      const actual = await userStorage.getUsers(userIds);

      expect(actual).toBeNull();
    });
    it('a list of users is returned matching the ids', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('User_12345', '{"sub": "12345","email":"test3@localuser.com", "first_name": "Tester", "last_name" : "Testing"}');
        redisMock.set('User_54321', '{"sub": "54321","email":"test4@localuser.com", "first_name": "Retset", "last_name" : "Gnitset"}');
        return redisMock;
      }));
      const userIds = ['12345', '54321'];

      userStorage = require('./../../src/app/user/adapter/UserRedisAdapter');
      const actual = await userStorage.getUsers(userIds);

      expect(actual).not.toBeNull();
      expect(actual[0].sub).toBe('12345');
      expect(actual[1].sub).toBe('54321');
    });
    it('then null is returned if there are no users found', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        return redisMock;
      }));
      const userIds = ['abcdef', 'ghijkl'];

      userStorage = require('./../../src/app/user/adapter/UserRedisAdapter');
      const actual = await userStorage.getUsers(userIds);

      expect(actual).toBeNull();
    });
  });
});

const RedisMock = require('ioredis-mock').default;
const UserStorage = require('./../../src/app/user/adapter/UserRedisAdapter');
const { promisify } = require('util');
const crypto = require('crypto');

describe('When using redis storage service', () => {
  describe('then when I call find', () => {
    let redis;
    let userStorage;

    beforeEach(() => {
      redis = new RedisMock();
      redis.disconnect = () => true;
      userStorage = new UserStorage(redis);
    });

    it('the user are retrieved from redis', async () => {
      redis.set('Users', '[{"sub": "12345", "email":"test@localuser.com"}]');
      redis.set('User_12345', '{"sub": "test@localuser.com"}');

      const actual = await userStorage.findByUsername('test@localuser.com');

      expect(actual).not.toBe(undefined);
      expect(JSON.stringify(actual)).toBe('{"sub":"test@localuser.com"}');
    });
    it('then null is returned if there is no data', async () => {
      const actual = await userStorage.findByUsername('test@localuser.com');

      expect(actual).toBe(null);
    });
    it('then the json is parsed and returned', async () => {
      redis.set('Users', '[{"sub": "54321", "email":"test4@localuser.com"},{"sub": "12345", "email":"test3@localuser.com"}]');
      redis.set('User_12345', '{"sub": "test3@localuser.com","email":"test3@localuser.com", "first_name": "Tester", "last_name" : "Testing"}');

      const actual = await userStorage.findByUsername('test3@localuser.com');

      expect(actual).not.toBe(null);
      expect(actual.first_name).toBe('Tester');
    });
    it('then if the user is not found then null is returned', async () => {
      redis.set('Users', '[{"sub": "54321", "email":"test4@localuser.com"},{"sub": "12345", "email":"test3@localuser.com"}]');
      redis.set('User_12345', '{"sub": "test3@localuser.com","email":"test3@localuser.com", "first_name": "Tester", "last_name" : "Testing"}');

      const actual = await userStorage.findByUsername('test4@localuser.com');

      expect(actual).toBe(null);
    });
  });
  describe('then when I call change password', () => {
    let redis;
    let userStorage;

    beforeEach(() => {
      redis = new RedisMock();
      redis.disconnect = () => true;
      userStorage = new UserStorage(redis);
    });
    it('if the user does not exist false is returned', async () => {
      redis.set('User_test3@localuser.com', '[{"sub": "test@localuser.com"}]');

      const actual = await userStorage.changePassword('test@localuser.com', 'my-new-password');

      expect(actual).toBe(false);
    });
    it('if the user exists the record is updated', async () => {
      redis.set('User_test3@localuser.com', '{"sub": "test3@localuser.com","email":"test3@localuser.com", "first_name": "Tester", "last_name" : "Testing", "salt":"123456768"}');

      const actual = await userStorage.changePassword('test3@localuser.com', 'my-new-password');

      expect(actual).toBe(true);
      const findResult = await userStorage.find('test3@localuser.com');
      expect(findResult).not.toBe(null);
      const request = promisify(crypto.pbkdf2);
      const saltBuffer = Buffer.from(findResult.salt, 'utf8');
      const derivedKey = await request('my-new-password', saltBuffer, 10000, 512, 'sha512');
      expect(findResult.password).toBe(derivedKey.toString('base64'));
    });
  });
});

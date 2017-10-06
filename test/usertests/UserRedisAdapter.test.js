const expect = require('chai').expect;
const sinon = require('sinon');
const RedisMock = require('ioredis-mock').default;
const UserStorage = require('../../src/user/UserRedisAdapter');

const users = '[{"sub": "test3@localuser.com", "first_name": "Tester", "last_name" : "Testing"}, {"sub": "demo3@localuser.com", "first_name": "Demo", "last_name" : "Strator"}]';

describe('When using redis storage service', () => {
  describe('then when I call find', () => {
    let redis;
    let sandbox;
    let userStorage;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      redis = new RedisMock();
      userStorage = new UserStorage(redis);
    });
    afterEach(() => {
      sandbox.restore();
    });

    it('the user are retrieved from redis', () =>{
      redis.set('Users','[{"sub": "test@localuser.com"}]');

      return userStorage.find('test@localuser.com').then((actual)=>{
        expect(actual).to.not.equal(undefined);
        expect(JSON.stringify(actual)).to.equal('{"sub":"test@localuser.com"}');
      });
    });
    it('then null is returned if there is no data', () => {
      return userStorage.find('test@localuser.com').then((actual)=>{
        expect(actual).to.equal(null);
      });
    });
    it('then the json is parsed and returned', () => {
      redis.set('Users',users);
      return userStorage.find('test3@localuser.com').then((actual)=>{
        expect(actual).to.not.equal(null);
        expect(actual.first_name).to.equal('Tester');
      });
    });
  });
});
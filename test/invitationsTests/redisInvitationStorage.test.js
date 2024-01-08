jest.mock('uuid', () => ({ v4: () => '1dcf73dd-1613-470e-a35e-378a3375a6fe' }));
jest.mock('./../../src/infrastructure/config', () => ({
  invitations: {
    redisUrl: 'http://orgs.api.test',
  },
}));

jest.mock('./../../src/infrastructure/logger', () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    audit: jest.fn(),
  };
});

describe('When using the redis invitation storage', () => {
  let invitationStorage;

  beforeEach(() => {
    jest.resetModules();
  });
  describe('and getting the invitation by email', () => {
    it('then null is returned if the invitation does not exist', async () => {
      const mocks = { redis: null }
      jest.mock('ioredis', () => {
        const Redis = require('ioredis-mock')
        if (typeof Redis === 'object') {
          return {
            Command: { _transformer: { argument: {}, reply: {} } }
          }
        }
        // second mock for our code
        return function(...args) {
          const instance = new Redis(args);
          mocks.redis = instance
          return instance
        }
      })


      invitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');

      const actual = await invitationStorage.getUserInvitation('test@local.com');

      expect(actual).toBeNull();
    });
    it('then the invitation is returned if it exists', async () => {

      const mocks = { redis: null }
      jest.mock('ioredis', () => {
        const Redis = require('ioredis-mock')
        if (typeof Redis === 'object') {
          return {
            Command: { _transformer: { argument: {}, reply: {} } }
          }
        }
        // second mock for our code
        return function(...args) {
          const instance = new Redis(args);
          instance.set('UserInvitation_test@local.com', '{"email":"test@local.com","firstName":"tester"}');
          mocks.redis = instance
          return instance
        }
      })


      invitationStorage = require('./../../src/app/invitations/data');

      const actual = await invitationStorage.getUserInvitation('test@local.com');

      expect(actual).not.toBeNull();
    });
  });
  describe('and creating the invitation', () => {
    it('then the uuid is used to create the record', async () => {
      const mocks = { redis: null }
      jest.mock('ioredis', () => {
        const Redis = require('ioredis-mock')
        if (typeof Redis === 'object') {
          return {
            Command: { _transformer: { argument: {}, reply: {} } }
          }
        }
        // second mock for our code
        return function(...args) {
          const instance = new Redis(args);
          mocks.redis = instance
          return instance
        }
      })

      invitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');
      await invitationStorage.createUserInvitation({ firstName: 'Tester', email: 'test@local.com' });
      const record = await invitationStorage.getUserInvitation('1dcf73dd-1613-470e-a35e-378a3375a6fe');

      expect(record).not.toBeNull();
      expect(record.firstName).toBe('Tester');
      expect(record.email).toBe('test@local.com');
      expect(record.id).toBe('1dcf73dd-1613-470e-a35e-378a3375a6fe');
    });
    it('then if the email is not supplied then a record is not created', async () => {
      invitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');
      const actual = await invitationStorage.createUserInvitation();

      expect(actual).toBeNull();
    });
  });
  describe('and deleting the invitation', () => {
    it('then if the uid is not supplied the record is not deleted', async () => {


      const mocks = { redis: null }
      jest.mock('ioredis', () => {
        const Redis = require('ioredis-mock')
        if (typeof Redis === 'object') {
          return {
            Command: { _transformer: { argument: {}, reply: {} } }
          }
        }
        // second mock for our code
        return function(...args) {
          const instance = new Redis(args);
          instance.set('UserInvitation_test@local.com', '{"email":"test@local.com","firstName":"tester"}');

          mocks.redis = instance
          return instance
        }
      })

      invitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');
      await invitationStorage.deleteInvitation();

      const record = await invitationStorage.getUserInvitation('test@local.com');
      expect(record).not.toBeNull();
    });
    it('then the uid is used to find the record and delete it', async () => {


      const mocks = { redis: null }
      jest.mock('ioredis', () => {
        const Redis = require('ioredis-mock')
        if (typeof Redis === 'object') {
          return {
            Command: { _transformer: { argument: {}, reply: {} } }
          }
        }
        // second mock for our code
        return function(...args) {
          const instance = new Redis(args);
          instance.set('UserInvitation_test@local.com', '{"email":"test@local.com","firstName":"tester"}');

          mocks.redis = instance
          return instance
        }
      })

      invitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');
      await invitationStorage.deleteInvitation('test@local.com');

      const record = await invitationStorage.getUserInvitation('test@local.com');
      expect(record).toBeNull();
    });
  });
});

jest.mock('uuid/v4');
jest.mock('./../../src/infrastructure/config', () => ({
  invitations: {
    redisUrl: 'http://orgs.api.test',
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

describe('When using the redis invitation storage', () => {
  let uuid;
  let uuidStub;
  let invitationStorage;

  beforeEach(() => {
    jest.resetModules();
    uuidStub = jest.fn().mockReturnValue('1dcf73dd-1613-470e-a35e-378a3375a6fe');

    uuid = require('uuid/v4');
    uuid.mockImplementation(uuidStub);
  });
  describe('and getting the invitation by email', () => {
    it('then null is returned if the invitation does not exist', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        return redisMock;
      }));

      invitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');

      const actual = await invitationStorage.getUserInvitation('test@local.com');

      expect(actual).toBeNull();
    });
    it('then the invitation is returned if it exists', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('UserInvitation_test@local.com', '{"email":"test@local.com","firstName":"tester"}');
        return redisMock;
      }));

      invitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');

      const actual = await invitationStorage.getUserInvitation('test@local.com');

      expect(actual).not.toBeNull();
    });
  });
  describe('and creating the invitation', () => {
    it('then the uuid is used to create the record', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        return redisMock;
      }));

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
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('UserInvitation_test@local.com', '{"email":"test@local.com","firstName":"tester"}');
        return redisMock;
      }));

      invitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');
      await invitationStorage.deleteInvitation();

      const record = await invitationStorage.getUserInvitation('test@local.com');
      expect(record).not.toBeNull();
    });
    it('then the uid is used to find the record and delete it', async () => {
      jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
        const RedisMock = require('ioredis-mock').default;
        const redisMock = new RedisMock();
        redisMock.set('UserInvitation_test@local.com', '{"email":"test@local.com","firstName":"tester"}');
        return redisMock;
      }));

      invitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');
      await invitationStorage.deleteInvitation('test@local.com');

      const record = await invitationStorage.getUserInvitation('test@local.com');
      expect(record).toBeNull();
    });
  });
});

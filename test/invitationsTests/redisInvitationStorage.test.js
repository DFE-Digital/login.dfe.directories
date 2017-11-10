const RedisMock = require('ioredis-mock').default;
const InvitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');

describe('When using the redis invitation storage', () => {
  let redis;
  let invitationStorage;

  beforeEach(() => {

    redis = new RedisMock();

    invitationStorage = new InvitationStorage(redis);
  });
  describe('and getting the invitation by email', () => {
    it('then null is returned if the invitation does not exist', async () => {
      const actual = await invitationStorage.getUserInvitation('test@local.com');

      expect(actual).toBeNull();
    });
    it('then the invitation is returned if it exists', async () => {
      redis.set('UserInvitation_test@local.com', '{"email":"test@local.com","firstName":"tester"}');

      const actual = await invitationStorage.getUserInvitation('test@local.com');

      expect(actual).not.toBeNull();
    });
  });
  describe('and creating the invitation', () => {
    it('then the email is used to create the record', async () => {

      await invitationStorage.createUserInvitation('test@local.com', { firstName: 'Tester'});
      const record = await redis.get('UserInvitation_test@local.com');

      expect(record).not.toBeNull();
      const resetCode = JSON.parse(record);
      expect(resetCode.firstName).toBe('Tester');
    });
    it('then if the email is not supplied then a record is not created', async () => {
      const actual = await invitationStorage.createUserInvitation();

      expect(actual).toBeNull();
    });
  });
  describe('and deleting the invitation', () => {
    it('then if the uid is not supplied the record is not deleted', async () => {
      redis.set('UserInvitation_test@local.com', '{"email":"test@local.com","firstName":"tester"}');

      await invitationStorage.deleteInvitation();

      const record = await redis.get('UserInvitation_test@local.com');
      expect(record).not.toBeNull();
    });
    it('then the uid is used to find the record and delete it', async ()=> {
      redis.set('UserInvitation_test@local.com', '{"email":"test@local.com","firstName":"tester"}');

      await invitationStorage.deleteInvitation('test@local.com');

      const record = await redis.get('UserInvitation_test@local.com');
      expect(record).toBeNull();
    });
  });
});

jest.mock('./../../src/app/invitations/data/redisInvitationStorage', () => {
  return {
    getUserInvitation: jest.fn(),
    updateInvitation: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');
const { getUserInvitation, updateInvitation } = require('./../../src/app/invitations/data/redisInvitationStorage');
const patchInvitation = require('./../../src/app/invitations/api/patchInvitation');

describe('When patching an invitation', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        id: '714d039d-92f7-4bc4-9422-63d194a7',
      },
      header: () => 'x-correlation-id',
      body: {
        isCompleted: true,
      },
    };

    res = httpMocks.createResponse();

    getUserInvitation.mockReset();
    getUserInvitation.mockReturnValue({
      email: 'severus.snape@hogwarts.test',
      firstName: 'Severus',
      lastName: 'Snape',
      oldCredentials: {
        source: 'OSA',
        username: 'snape',
        password: 'hashed-password',
        salt: 'some-salt',
        tokenSerialNumber: '1234567890',
      },
      id: '714d039d-92f7-4bc4-9422-63d194a7',
    });
  });

  it('then it should return 400 - Bad request if no keys in body', async () => {
    req.body = {};

    await patchInvitation(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toBe('No properties specified for patching');
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return 400 - Bad request if invalid key specified in body', async () => {
    req.body = {
      isCompleted: true,
      bad1: 1,
      bad2: false,
    };

    await patchInvitation(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toBe('Invalid property patched - bad1. Patchable properties are isCompleted');
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return 404 - Not found if invitation is not found', async () => {
    getUserInvitation.mockReturnValue(null);

    await patchInvitation(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should store patched invitation', async () => {
    await patchInvitation(req, res);

    expect(updateInvitation.mock.calls).toHaveLength(1);
    expect(updateInvitation.mock.calls[0][0]).toMatchObject({
      email: 'severus.snape@hogwarts.test',
      firstName: 'Severus',
      lastName: 'Snape',
      oldCredentials: {
        source: 'OSA',
        username: 'snape',
        password: 'hashed-password',
        salt: 'some-salt',
        tokenSerialNumber: '1234567890',
      },
      id: '714d039d-92f7-4bc4-9422-63d194a7',
      isCompleted: true,
    });
  });
});
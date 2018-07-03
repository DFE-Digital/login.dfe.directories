jest.mock('./../../src/app/invitations/data/redisInvitationStorage', () => {
  return {
    findInvitationForEmail: jest.fn(),
  };
});

const { findInvitationForEmail } = require('./../../src/app/invitations/data/redisInvitationStorage');
const httpMocks = require('node-mocks-http');
const getInvitationByEmail = require('./../../src/app/invitations/api/getInvitationByEmail');

describe('When getting an invitation by email', () => {
  let req;
  let res;

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      get: jest.fn().mockReturnValue('correlation-id'),
      params: {
        email: 'user.one@unit.tests',
      },
    };

    findInvitationForEmail.mockReset().mockReturnValue({
      firstName: 'User',
      lastName: 'One',
      email: 'user.one@unit.tests',
      origin: {
        clientId: 'client1',
        redirectUri: 'https://client.one/auth/cb'
      },
      code: 'ABC123',
      id: 'inv-1',
    });
  });

  it('then it should search in storage for invitation by that email that is not completed', async () => {
    await getInvitationByEmail(req, res);

    expect(findInvitationForEmail).toHaveBeenCalledTimes(1);
    expect(findInvitationForEmail).toHaveBeenCalledWith('user.one@unit.tests', true, 'correlation-id');
  });

  it('then it should return 200 with invitation if found', async () => {
    await getInvitationByEmail(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getData()).toEqual({
      firstName: 'User',
      lastName: 'One',
      email: 'user.one@unit.tests',
      origin: {
        clientId: 'client1',
        redirectUri: 'https://client.one/auth/cb'
      },
      code: 'ABC123',
      id: 'inv-1',
    });
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return 404 if invitation not found', async () => {
    findInvitationForEmail.mockReturnValue(undefined);

    await getInvitationByEmail(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });
});

'use strict';

jest.mock('./../../src/app/invitations/data/redisInvitationStorage');
jest.mock('./../../src/infrastructure/logger', () => {
  return {
    info: jest.fn(),
    error: jest.fn(),
  };
});
jest.mock('login.dfe.notifications.client');
jest.mock('./../../src/infrastructure/config', () => ({
  redis: {
    url: 'http://orgs.api.test',
  },
  notifications: {
    connectionString: '',
  },
  hotConfig: {
    type: 'static',
  },
}));

jest.mock('./../../src/app/invitations/data/redisInvitationStorage', () => {
  return {
    getUserInvitation: jest.fn(),
  };
});

const redisInvitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');
const post = require('../../src/app/invitations/api/postResendInvitation');

const httpMocks = require('node-mocks-http');

describe('When resending an invitation', () => {
  let res;
  let req;
  const expectedEmailAddress = 'test@local.com';
  const expectedFirstName = 'Test';
  const expectedLastName = 'User';
  const expectedInvitationId = '30ab55b5-9c27-45e9-9583-abb349b12f35';
  const expectedRequestCorrelationId = '41ab33e5-4c27-12e9-3451-abb349b12f35';
  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      params: {
        id: expectedInvitationId,
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };
  });
  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });

  it('then a bad request is returned if the request has not provided an invitation_id', async () => {
    req.params.id = '';

    await post(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('then if the invitation is not found a 404 is returned', async () => {
    redisInvitationStorage.getUserInvitation.mockReset();

    redisInvitationStorage.getUserInvitation.mockReturnValue(null);

    await post(req, res);

    expect(res.statusCode).toBe(404);
  });

  it('then it should resend invitation', async () => {
    redisInvitationStorage.getUserInvitation.mockReturnValue({
      id: expectedInvitationId,
      email: expectedEmailAddress,
      firstName: expectedFirstName,
      lastName: expectedLastName,
      code: 'XYZ987',
      selfStarted: true,
      origin: {
        clientId: 'client1',
        redirectUri: 'https://source.test',
      },
    });

    await post(req, res);

    expect(res._getData()).toEqual({
      id: expectedInvitationId,
      email: expectedEmailAddress,
      firstName: expectedFirstName,
      lastName: expectedLastName,
      code: 'XYZ987',
      selfStarted: true,
      origin: {
        clientId: 'client1',
        redirectUri: 'https://source.test',
      },
    });
  });

  it('then it should send status 200', async () => {
    redisInvitationStorage.getUserInvitation.mockReturnValue({
      id: expectedInvitationId,
      email: expectedEmailAddress,
      firstName: expectedFirstName,
      lastName: expectedLastName,
      code: 'XYZ987',
      selfStarted: true,
      origin: {
        clientId: 'client1',
        redirectUri: 'https://source.test',
      },
    });

    await post(req, res);

    expect(res.statusCode).toBe(200);
  });

  it('then a 500 response is returned if there is an error', async () => {
    redisInvitationStorage.getUserInvitation.mockReset();
    redisInvitationStorage.getUserInvitation = () => { throw new Error(); };

    await post(req, res);

    expect(res.statusCode).toBe(500);
  });
});

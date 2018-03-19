'use strict';

jest.mock('./../../src/app/invitations/data/redisInvitationStorage');
jest.mock('./../../src/app/invitations/utils', () => {
  return {
    generateInvitationCode: jest.fn().mockReturnValue('invite-code'),
  };
});
jest.mock('./../../src/infrastructure/logger', () => {
  return {};
});
jest.mock('login.dfe.notifications.client');
jest.mock('./../../src/infrastructure/config', () => ({
  redis: {
    url: 'http://orgs.api.test',
  },
  notifications: {
    connectionString: '',
  },
}));

jest.mock('./../../src/app/invitations/data/redisInvitationStorage', () => {
  const createUserInvitationStub = jest.fn();
  return {
    createUserInvitation: jest.fn().mockImplementation(createUserInvitationStub),
  };
});

const redisStorage = require('./../../src/app/invitations/data/redisInvitationStorage');

const httpMocks = require('node-mocks-http');

describe('When creating an invitation', () => {
  let res;
  let req;
  let logger;
  let sendInvitationStub;
  let sendMigrationInvitationStub;
  let notificationClient;
  let post;

  const expectedEmailAddress = 'test@local.com';
  const expectedFirstName = 'Test';
  const expectedLastName = 'User';
  const expectedServiceName = 'New Service';
  const expectedInvitationId = '30ab55b5-9c27-45e9-9583-abb349b12f35';
  const expectedRequestCorrelationId = '41ab33e5-4c27-12e9-3451-abb349b12f35';

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      body: {
        email: expectedEmailAddress,
        firstName: expectedFirstName,
        lastName: expectedLastName,
        username: 'testuser',
        salt: 'qwer456',
        password: 'Password1',
        serviceName: expectedServiceName,
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    logger = require('./../../src/infrastructure/logger');
    logger.error = (() => ({}));

    const createInvitationStub = jest.fn().mockImplementation(() => (
      {
        id: expectedInvitationId,
        firstName: expectedFirstName,
        lastName: expectedLastName,
      }
    ));

    sendInvitationStub = jest.fn()
      .mockImplementation(
        (email, firstName, lastName, invitationId) => {
        });

    sendMigrationInvitationStub = jest.fn();

    notificationClient = require('login.dfe.notifications.client');
    notificationClient.mockImplementation(() => ({
      sendInvitation: sendInvitationStub,
      sendMigrationInvitation: sendMigrationInvitationStub,
    }));
    post = require('../../src/app/invitations/api/postInvitations');
  });
  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });
  it('then a bad request is returned if the request has not provided the firstName', async () => {
    req.body.firstName = '';

    await post(req, res);

    expect(res.statusCode).toBe(400);
  });
  it('then a bad request is returned if the request has not provided the lastName', async () => {
    req.body.lastName = '';

    await post(req, res);

    expect(res.statusCode).toBe(400);
  });
  it('then a bad request is returned if the request has not provided the email', async () => {
    req.body.email = '';

    await post(req, res);

    expect(res.statusCode).toBe(400);
  });
  it('then the record is created', async () => {
    redisStorage.createUserInvitation.mockReset();
    redisStorage.createUserInvitation.mockReturnValue({
      id: expectedInvitationId,
    });

    await post(req, res);

    expect(res.statusCode).toBe(201);
    expect(redisStorage.createUserInvitation.mock.calls[0][0]).toMatchObject({
      email: expectedEmailAddress,
      firstName: expectedFirstName,
      lastName: expectedLastName,
      code: 'invite-code',
    });
    expect(redisStorage.createUserInvitation.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
  });
  it('then the invitation object is returned in the response with an id', async () => {
    redisStorage.createUserInvitation.mockReset();
    redisStorage.createUserInvitation.mockReturnValue({
      id: expectedInvitationId,
      firstName: expectedFirstName,
      lastName: expectedLastName,
    });

    await post(req, res);

    expect(res._getData().id).toBe(expectedInvitationId);
    expect(res._getData().firstName).toBe(expectedFirstName);
    expect(res._getData().lastName).toBe(expectedLastName);
  });
  it('then an invitation email is sent when the record is first created', async () => {
    redisStorage.createUserInvitation.mockReset();
    redisStorage.createUserInvitation.mockReturnValue({
      id: expectedInvitationId,
      firstName: expectedFirstName,
      lastName: expectedLastName,
    });

    await post(req, res);

    expect(sendInvitationStub.mock.calls[0][0]).toBe(expectedEmailAddress);
    expect(sendInvitationStub.mock.calls[0][1]).toBe(expectedFirstName);
    expect(sendInvitationStub.mock.calls[0][2]).toBe(expectedLastName);
    expect(sendInvitationStub.mock.calls[0][3]).toBe(expectedInvitationId);
    expect(sendInvitationStub.mock.calls[0][4]).toBe('invite-code');
  });
  it('then an invitation email is sent with migration invite template when the record is first created and source is EAS', async () => {
    redisStorage.createUserInvitation.mockReset();
    redisStorage.createUserInvitation.mockReturnValue({
      id: expectedInvitationId,
      firstName: expectedFirstName,
      lastName: expectedLastName,
    });
    req.body.oldCredentials = {
      source: 'EAS',
    };

    await post(req, res);

    expect(sendMigrationInvitationStub.mock.calls).toHaveLength(1);
    expect(sendMigrationInvitationStub.mock.calls[0][0]).toBe(expectedEmailAddress);
    expect(sendMigrationInvitationStub.mock.calls[0][1]).toBe(expectedFirstName);
    expect(sendMigrationInvitationStub.mock.calls[0][2]).toBe(expectedLastName);
    expect(sendMigrationInvitationStub.mock.calls[0][3]).toBe(expectedInvitationId);
    expect(sendMigrationInvitationStub.mock.calls[0][4]).toBe('invite-code');
  });
  it('then a 500 response is returned if there is an error', async () => {
    redisStorage.createUserInvitation.mockReset();
    redisStorage.createUserInvitation = () => {
      throw new Error();
    };

    await post(req, res);

    expect(res.statusCode).toBe(500);
  });
});

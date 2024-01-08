'use strict';

jest.mock('./../../src/app/invitations/data');
jest.mock('./../../src/app/invitations/utils', () => ({
  generateInvitationCode: jest.fn().mockReturnValue('invite-code'),
}));
jest.mock('./../../src/infrastructure/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  audit: jest.fn(),
}));
jest.mock('login.dfe.notifications.client');
jest.mock('./../../src/infrastructure/config', () => ({
  redis: {
    url: 'http://orgs.api.test',
  },
  notifications: {
    connectionString: '',
  },
  applications: {
    type: 'static',
  },
  hostingEnvironment: {
    env: 'dev',
  },
  loggerSettings: {
    applicationName: 'Directories-API',
  },
}));

jest.mock('./../../src/infrastructure/applications');
jest.mock('./../../src/app/invitations/data', () => ({
  createUserInvitation: jest.fn(),
  findInvitationForEmail: jest.fn(),
  getUserInvitation: jest.fn(),
  updateInvitation: jest.fn(),
}));
jest.mock('./../../src/app/user/adapter', () => ({
  findByUsername: jest.fn(),
}));

const notificationClient = require('login.dfe.notifications.client');
const httpMocks = require('node-mocks-http');
const logger = require('../../src/infrastructure/logger');
const redisStorage = require('../../src/app/invitations/data');
const userStorage = require('../../src/app/user/adapter');
const { getServiceById } = require('../../src/infrastructure/applications');
const post = require('../../src/app/invitations/api/postInvitations');
const { default: redisMock } = require('ioredis-mock');

describe('When creating an invitation', () => {
  let res;
  let req;
  let sendInvitationStub;
  let sendRegisterExistingUserStub;
  let sendMigrationInvitationStub;

  const expectedEmailAddress = 'test@local.com';
  const expectedFirstName = 'Test';
  const expectedLastName = 'User';
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
        origin: {
          clientId: 'client1',
          redirectUri: 'https://source.test',
        },
        selfStarted: true,
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    getServiceById.mockReset().mockImplementation((id) => {
      if (id !== 'client1') {
        return undefined;
      }
      return {
        client_id: 'client1',
        client_secret: 'some-secure-secret',
        relyingParty: {
          redirect_uris: [
            'https://client.one/auth/cb',
            'https://client.one/register/complete',
          ],
          post_logout_redirect_uris: [
            'https://client.one/signout/complete',
          ],
          params: {
            digipassRequired: true,
          },
        },
        name: 'Client One',
      };
    });

    logger.info.mockReset();
    logger.error.mockReset();

    redisStorage.createUserInvitation.mockReset().mockImplementation((requestedInvitation) => Object.assign(requestedInvitation, { id: expectedInvitationId }));
    redisStorage.findInvitationForEmail.mockReset();

    userStorage.findByUsername.mockReset().mockReturnValue(null);

    sendInvitationStub = jest.fn();
    sendMigrationInvitationStub = jest.fn();
    sendRegisterExistingUserStub = jest.fn();
    notificationClient.mockReset().mockImplementation(() => ({
      sendInvitation: sendInvitationStub,
      sendMigrationInvitation: sendMigrationInvitationStub,
      sendRegisterExistingUser: sendRegisterExistingUserStub,
    }));
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
    await post(req, res);

    expect(res._getData().id).toBe(expectedInvitationId);
    expect(res._getData().firstName).toBe(expectedFirstName);
    expect(res._getData().lastName).toBe(expectedLastName);
  });

  it('then an invitation email is sent when the record is first created', async () => {
    await post(req, res);

    console.log(sendInvitationStub.mock.calls);

    expect(sendInvitationStub.mock.calls[0][0]).toBe(expectedEmailAddress);
    expect(sendInvitationStub.mock.calls[0][1]).toBe(expectedFirstName);
    expect(sendInvitationStub.mock.calls[0][2]).toBe(expectedLastName);
    expect(sendInvitationStub.mock.calls[0][3]).toBe(expectedInvitationId);
    expect(sendInvitationStub.mock.calls[0][4]).toBe('invite-code');
    expect(sendInvitationStub.mock.calls[0][5]).toBe('Client One');
    expect(sendInvitationStub.mock.calls[0][6]).toBe(true);
    expect(sendInvitationStub.mock.calls[0][7]).toBe(true);
  });

  it('then an invitation email is sent with migration invite template when the record is first created and source is EAS', async () => {
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
    redisStorage.createUserInvitation.mockImplementation(() => {
      throw new Error();
    });

    await post(req, res);

    expect(res.statusCode).toBe(500);
  });

  it('then it should not create new invitation if an invitation already exists for email', async () => {
    redisStorage.findInvitationForEmail.mockReturnValue({
      id: 'existing-invitation-id',
      email: 'existing.user@unit.test',
      firstName: 'Existing',
      lastName: 'User',
      code: 'XYZ987',
      selfStarted: true,
      origin: {
        clientId: 'client1',
        redirectUri: 'https://source.test',
      },
    });

    await post(req, res);

    expect(redisStorage.createUserInvitation.mock.calls).toHaveLength(0);
  });

  it('then it should use existing invitation details to send notification', async () => {
    redisStorage.findInvitationForEmail.mockReturnValue({
      id: 'existing-invitation-id',
      email: 'existing.user@unit.test',
      firstName: 'Existing',
      lastName: 'User',
      code: 'XYZ987',
      selfStarted: true,
      origin: {
        clientId: 'client1',
        redirectUri: 'https://source.test',
      },
    });

    redisStorage.updateInvitation.mockReturnValue({
      id: 'existing-invitation-id',
      email: 'existing.user@unit.test',
      firstName: 'Existing',
      lastName: 'User',
      code: 'XYZ987',
      selfStarted: true,
      origin: {
        clientId: 'client1',
        redirectUri: 'https://source.test',
      },
    });

    await post(req, res);

    expect(sendInvitationStub.mock.calls).toHaveLength(1);
    expect(sendInvitationStub.mock.calls[0][0]).toBe('existing.user@unit.test');
    expect(sendInvitationStub.mock.calls[0][1]).toBe('Existing');
    expect(sendInvitationStub.mock.calls[0][2]).toBe('User');
    expect(sendInvitationStub.mock.calls[0][3]).toBe('existing-invitation-id');
    expect(sendInvitationStub.mock.calls[0][4]).toBe('XYZ987');
    expect(sendInvitationStub.mock.calls[0][5]).toBe('Client One');
    expect(sendInvitationStub.mock.calls[0][6]).toBe(true);
    expect(sendInvitationStub.mock.calls[0][7]).toBe(true);
  });

  it('then it should send status 202', async () => {
    redisStorage.findInvitationForEmail.mockReturnValue({
      id: 'existing-invitation-id',
      email: 'existing.user@unit.test',
      firstName: 'Existing',
      lastName: 'User',
      code: 'XYZ987',
      selfStarted: true,
      origin: {
        clientId: 'client1',
        redirectUri: 'https://source.test',
      },
    });

    await post(req, res);

    expect(res.statusCode).toBe(201);
  });

  it('then it should send existing invitation', async () => {
    redisStorage.findInvitationForEmail.mockReturnValue({
      id: 'existing-invitation-id',
      email: 'existing.user@unit.test',
      firstName: 'Existing',
      lastName: 'User',
      code: 'XYZ987',
      selfStarted: true,
      origin: {
        clientId: 'client1',
        redirectUri: 'https://source.test',
      },
    });

    await post(req, res);

    expect(res._getData()).toEqual({
      id: 'existing-invitation-id',
      email: 'existing.user@unit.test',
      firstName: 'Existing',
      lastName: 'User',
      code: 'XYZ987',
      selfStarted: true,
      origin: {
        clientId: 'client1',
        redirectUri: 'https://source.test',
      },
    });
  });

  it('then it should not create new invitation if an account already exists for email', async () => {
    userStorage.findByUsername.mockReset().mockReturnValue({});

    await post(req, res);

    expect(redisStorage.createUserInvitation.mock.calls).toHaveLength(0);
  });

  it('then it should use invitation details to notify of existing account', async () => {
    userStorage.findByUsername.mockReset().mockReturnValue({});

    await post(req, res);

    expect(sendRegisterExistingUserStub.mock.calls).toHaveLength(1);
    expect(sendRegisterExistingUserStub.mock.calls[0][0]).toBe(expectedEmailAddress);
    expect(sendRegisterExistingUserStub.mock.calls[0][1]).toBe(expectedFirstName);
    expect(sendRegisterExistingUserStub.mock.calls[0][2]).toBe(expectedLastName);
    expect(sendRegisterExistingUserStub.mock.calls[0][3]).toBe('Client One');
    expect(sendRegisterExistingUserStub.mock.calls[0][4]).toBe('https://source.test');
  });

  it('then it should send status 202 if an account already exists for email', async () => {
    userStorage.findByUsername.mockReset().mockReturnValue({});

    await post(req, res);

    expect(res.statusCode).toBe(202);
  });
});

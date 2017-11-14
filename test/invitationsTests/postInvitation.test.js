'use strict';

jest.mock('./../../src/app/invitations/data/redisInvitationStorage');
jest.mock('./../../src/infrastructure/logger');
jest.mock('login.dfe.notifications.client');
jest.mock('./../../src/infrastructure/config');

const httpMocks = require('node-mocks-http');

describe('When getting an invitation', () => {
  let res;
  let req;
  let createInvitationStub;
  let redisInvitationStorage;
  let logger;
  let sendInvitationStub;
  let notificationClient;
  let config;
  let post;

  const expectedEmailAddress = 'test@local.com';
  const expectedFirstName = 'Test';
  const expectedLastName = 'User';
  const expectedServiceName = 'New Service';
  const expectedInvitationId = '30ab55b5-9c27-45e9-9583-abb349b12f35';

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
    };

    logger = require('./../../src/infrastructure/logger');
    logger.error = (() => ({}));

    createInvitationStub = jest.fn().mockImplementation(() => (
      {
        id: expectedInvitationId,
        firstName: expectedFirstName,
        lastName: expectedLastName,
      }
    ));

    sendInvitationStub = jest.fn()
      .mockImplementation(
        (email, firstName, lastName, serviceName, serviceWelcomeMessage, serviceWelcomeDescription) => { });

    redisInvitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');
    redisInvitationStorage.mockImplementation(() => ({
      createUserInvitation: createInvitationStub,
    }));

    config = require('./../../src/infrastructure/config');
    config.mockImplementation(() => ({
      notifications: {
        connectionString: '',
      },
    }));

    notificationClient = require('login.dfe.notifications.client');
    notificationClient.mockImplementation(() => ({
      sendInvitation: sendInvitationStub,
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
    await post(req, res);

    expect(res.statusCode).toBe(201);
    expect(createInvitationStub.mock.calls[0][0].email).toBe(expectedEmailAddress);
  });
  it('then the invitation object is returned in the response with an id', async () => {
    await post(req, res);

    expect(res._getData().id).toBe(expectedInvitationId);
    expect(res._getData().firstName).toBe(expectedFirstName);
    expect(res._getData().lastName).toBe(expectedLastName);
  });
  it('then an invitation email is sent when the record is first created', async () => {
    await post(req, res);

    expect(sendInvitationStub.mock.calls[0][0]).toBe(expectedEmailAddress);
    expect(sendInvitationStub.mock.calls[0][1]).toBe(expectedFirstName);
    expect(sendInvitationStub.mock.calls[0][2]).toBe(expectedLastName);
    expect(sendInvitationStub.mock.calls[0][3]).toBe(expectedInvitationId);
  });
  it('then a 500 response is returned if there is an error', async () => {
    createInvitationStub = jest.fn().mockImplementation(() => {
      throw new Error();
    });

    await post(req, res);

    expect(res.statusCode).toBe(500);
  });
});

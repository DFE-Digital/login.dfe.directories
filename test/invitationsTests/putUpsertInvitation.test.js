'use strict';

jest.mock('./../../src/app/invitations/data/redisInvitationStorage');
jest.mock('./../../src/infrastructure/logger');

const httpMocks = require('node-mocks-http');

describe('When getting an invitation', () => {
  const put = require('./../../src/app/invitations/api/putUpsertInvitation');

  let res;
  let req;
  let getInvitationStub;
  let createInvitationStub;
  let redisInvitationStorage;
  let logger;

  const expectedEmailAddress = 'test@local.com';

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      body: {
        firstName: '7654321',
        lastName: 'client1',
        username: 'testuser',
        email: expectedEmailAddress,
        salt: 'qwer456',
        password: 'Password1',
      },
    };

    logger = require('./../../src/infrastructure/logger');
    logger.error = (() => ({}));


    getInvitationStub = jest.fn().mockImplementation(() => ({
      userServiceRequest:
        {
          name: '',
        },
    }));
    createInvitationStub = jest.fn().mockImplementation(() => ({
      userServiceRequest:
        {
          name: '',
        },
    }));

    redisInvitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');
    redisInvitationStorage.mockImplementation(() => ({
      getUserInvitation: getInvitationStub,
      createUserInvitation: createInvitationStub,
    }));

  });
  it('then a bad request is returned if the request has not provided the firstName', async () => {
    req.body.firstName = '';

    await put(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isEndCalled()).toBe(true);
  });
  it('then a bad request is returned if the request has not provided the lastName', async () => {
    req.body.lastName = '';

    await put(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isEndCalled()).toBe(true);
  });
  it('then a bad request is returned if the request has not provided the email', async () => {
    req.body.email = '';

    await put(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isEndCalled()).toBe(true);
  });
  it('then the record is checked to see if it exists', async () => {
    await put(req, res);

    expect(res.statusCode).toBe(200);
    expect(getInvitationStub.mock.calls[0][0]).toBe(expectedEmailAddress);
  });
  it('then the record is created if it does not exist', async () => {
    getInvitationStub = jest.fn().mockImplementation(() => {
      return null;
    });

    await put(req, res);

    expect(res.statusCode).toBe(200);
    expect(createInvitationStub.mock.calls[0][0].email).toBe(expectedEmailAddress);
  });
  it('then an invitation email is sent', async () => {
    await put(req, res);
  });
  it('then a 500 response is returned if there is an error', async () => {
    getInvitationStub = jest.fn().mockImplementation(() => {
      throw new Error();
    });

    await put(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._isEndCalled()).toBe(true);
  });
});
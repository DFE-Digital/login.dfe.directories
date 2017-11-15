'use strict';

jest.mock('./../../src/app/invitations/data/redisInvitationStorage');
jest.mock('./../../src/infrastructure/logger');
jest.mock('login.dfe.notifications.client');

const httpMocks = require('node-mocks-http');

describe('When getting an invitation', () => {

  let req;
  let res;
  let redisInvitationStorage;
  let getInvitationStub;
  let logger;
  let get;
  const expectedInvitationId = '123EDCF';

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      params: {
        id: expectedInvitationId,
      },
    };

    logger = require('./../../src/infrastructure/logger');
    logger.error = (() => ({}));

    getInvitationStub = jest.fn().mockImplementation(() => {
      return {
        id: expectedInvitationId,
      };
    });

    redisInvitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');
    redisInvitationStorage.mockImplementation(() => ({
      getUserInvitation: getInvitationStub,
    }));

    get = require('../../src/app/invitations/api/getInvitations');
  });
  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });
  it('then a bad request is returned if the invitation id is not passed', async () => {
    req.params.id = '';

    await get(req, res);

    expect(res.statusCode).toBe(400);
  });
  it('then if the record is not found a 404 is returned', async () => {
    getInvitationStub = jest.fn().mockImplementation(() => {
      return null;
    });

    await get(req, res);

    expect(res.statusCode).toBe(404);
  });
  it('then if the record is found it is returned in the response', async () => {
    await get(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getData().id).toBe(expectedInvitationId);
  });
  it('then a 500 response is returned if there is an error', async () => {
    getInvitationStub = jest.fn().mockImplementation(() => {
      throw new Error();
    });

    await get(req, res);

    expect(res.statusCode).toBe(500);
  });
});
'use strict';

jest.mock('./../../src/app/invitations/data/redisInvitationStorage');
jest.mock('./../../src/infrastructure/logger');
jest.mock('login.dfe.notifications.client');
jest.mock('./../../src/infrastructure/config', () => ({
  redis: {
    url: 'http://orgs.api.test',
  },
}));

jest.mock('./../../src/app/invitations/data/redisInvitationStorage', () => {
  const getInvitationStub = jest.fn();
  return {
    getUserInvitation: jest.fn().mockImplementation(getInvitationStub),
  };
});

const redisInvitationStorage = require('./../../src/app/invitations/data/redisInvitationStorage');

const httpMocks = require('node-mocks-http');

describe('When getting an invitation', () => {

  let req;
  let res;
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
    redisInvitationStorage.getUserInvitation.mockReset();

    redisInvitationStorage.getUserInvitation.mockReturnValue(null);

    await get(req, res);

    expect(res.statusCode).toBe(404);
  });
  it('then if the record is found it is returned in the response', async () => {
    redisInvitationStorage.getUserInvitation.mockReset();
    redisInvitationStorage.getUserInvitation.mockReturnValue({
      id: '123EDCF',
    });

    await get(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getData().id).toBe(expectedInvitationId);
  });
  it('then a 500 response is returned if there is an error', async () => {
    redisInvitationStorage.getUserInvitation.mockReset();
    redisInvitationStorage.getUserInvitation = () => { throw new Error(); };

    await get(req, res);

    expect(res.statusCode).toBe(500);
  });
});
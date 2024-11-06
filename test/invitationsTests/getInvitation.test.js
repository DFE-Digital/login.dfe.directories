'use strict';

jest.mock('./../../src/app/invitations/data');
jest.mock('./../../src/infrastructure/logger', () => {
  return {
  };
});
jest.mock('login.dfe.jobs-client');
jest.mock('./../../src/infrastructure/config', () => ({
  redis: {
    url: 'http://orgs.api.test',
  },
}));

jest.mock('./../../src/app/invitations/data', () => {
  const getInvitationStub = jest.fn();
  return {
    getUserInvitation: jest.fn().mockImplementation(getInvitationStub),
  };
});

const invitationStorage = require('./../../src/app/invitations/data');

const httpMocks = require('node-mocks-http');

describe('When getting an invitation', () => {

  let req;
  let res;
  let logger;
  let get;
  const expectedInvitationId = '123EDCF';
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

    logger = require('./../../src/infrastructure/logger');
    logger.error = (() => ({}));

    get = require('../../src/app/invitations/api/getInvitation');
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
    invitationStorage.getUserInvitation.mockReset();

    invitationStorage.getUserInvitation.mockReturnValue(null);

    await get(req, res);

    expect(res.statusCode).toBe(404);
  });
  it('then if the record is found it is returned in the response', async () => {
    invitationStorage.getUserInvitation.mockReset();
    invitationStorage.getUserInvitation.mockReturnValue({
      id: '123EDCF',
    });

    await get(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getData().id).toBe(expectedInvitationId);
    expect(invitationStorage.getUserInvitation.mock.calls[0][0]).toBe(expectedInvitationId);
    expect(invitationStorage.getUserInvitation.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
  });
  it('then a 500 response is returned if there is an error', async () => {
    invitationStorage.getUserInvitation.mockReset();
    invitationStorage.getUserInvitation = () => { throw new Error(); };

    await get(req, res);

    expect(res.statusCode).toBe(500);
  });
});

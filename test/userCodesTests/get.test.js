jest.mock('./../../src/infrastructure/config', () => ({
  userCodes: {
    type: 'redis',
    params: {
      redisUrl: 'http://orgs.api.test',
    },
  },
}));

jest.mock('./../../src/app/userCodes/data/redisUserCodeStorage', () => {
  const getUserCodeStub = jest.fn().mockReturnValue({ uid: '8332e8c9-d665-4ca8-8eed-379ce773e0f6', code: 'ABC123', redirectUri: 'http://local.test' });
  const getUserCodeByEmailStub = jest.fn().mockReturnValue({ uid: '7332e8c9-d665-4ca8-8eed-379ce773e0f6', email: 'test@test.local', code: 'XYZ123', redirectUri: 'http://local.test' });
  return {
    getUserCode: jest.fn().mockImplementation(getUserCodeStub),
    getUserCodeByEmail: jest.fn().mockImplementation(getUserCodeByEmailStub),
  };
});
jest.mock('./../../src/infrastructure/logger', () => {
  return {
  };
});

const redisUserCodeStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
const get = require('./../../src/app/userCodes/api/get');
const httpMocks = require('node-mocks-http');


describe('When getting a user code', () => {
  let req;
  let res;
  const expectedRequestCorrelationId = '45174020-57bb-40cc-b16d-0064745e9df9';

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      params: {
        uid: '8332e8c9-d665-4ca8-8eed-379ce773e0f6',
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

  });
  it('then an empty response is returned and a bad request status code sent if there is no uid', async () => {
    const uidValues = ['', undefined, null];

    await Promise.all(await uidValues.map(async (valueToUse) => {
      req.params.uid = valueToUse;

      await get(req, res);
      expect(res.statusCode).toBe(400);
    }));
  });
  it('then if a code exists for the uid and the code matches a successful response is returned', async () => {
    await get(req, res);

    expect(res._getData().code).toBe('ABC123');
    expect(res._getData().uid).toBe('8332e8c9-d665-4ca8-8eed-379ce773e0f6');
  });
  it('then if no code is found for the uid it is checked against the find by email', async () => {
    redisUserCodeStorage.getUserCode.mockReturnValue(null);

    await get(req, res);

    expect(redisUserCodeStorage.getUserCodeByEmail.mock.calls[0][0]).toBe('8332e8c9-d665-4ca8-8eed-379ce773e0f6');
    expect(redisUserCodeStorage.getUserCodeByEmail.mock.calls[0][1]).toBe('PasswordReset');
    expect(res._getData().code).toBe('XYZ123');
    expect(res._getData().uid).toBe('7332e8c9-d665-4ca8-8eed-379ce773e0f6');
  });
  it('then the parameters are passed to the storage provider', async () => {
    await get(req, res);

    expect(redisUserCodeStorage.getUserCode.mock.calls[0][0]).toBe('8332e8c9-d665-4ca8-8eed-379ce773e0f6');
    expect(redisUserCodeStorage.getUserCode.mock.calls[0][1]).toBe('PasswordReset');
    expect(redisUserCodeStorage.getUserCode.mock.calls[0][2]).toBe(expectedRequestCorrelationId);
  });
});

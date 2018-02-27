jest.mock('./../../src/infrastructure/config', () => ({
  userCodes: {
    type: 'redis',
    params: {
      redisUrl: 'http://orgs.api.test',
    },
  },
}));

jest.mock('./../../src/app/userCodes/data/redisUserCodeStorage', () => {
  const getUserPasswordResetCodeStub = jest.fn().mockReturnValue({ uid: '7654321', code: 'ABC123', redirectUri: 'http://local.test' });
  return {
    getUserPasswordResetCode: jest.fn().mockImplementation(getUserPasswordResetCodeStub),
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
        uid: '7654321',
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
    expect(res._getData().uid).toBe('7654321');
  });
  it('then the code is not matched against case', async () => {
    req.params.code = 'abc123';

    await get(req, res);

    expect(res._getData().code).toBe('ABC123');
    expect(res._getData().uid).toBe('7654321');
    expect(res._getData().redirectUri).toBe('http://local.test');
  });
  it('then the parameters are passed to the storage provider', async () => {
    await get(req, res);

    expect(redisUserCodeStorage.getUserPasswordResetCode.mock.calls[0][0]).toBe('7654321');
    expect(redisUserCodeStorage.getUserPasswordResetCode.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
  });
});

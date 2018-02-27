jest.mock('./../../src/infrastructure/config', () => ({
  userCodes: {
    type: 'static',
  },
}));
jest.mock('./../../src/infrastructure/logger', () => {
  return {
    warn :jest.fn(),
  };
});

jest.mock('./../../src/app/userCodes/data/staticUserCodeStorage', () => {
  const deleteUserPasswordResetCodeStub = jest.fn();
  return {
    deleteUserPasswordResetCode: jest.fn().mockImplementation(deleteUserPasswordResetCodeStub),
  };
});

const redisUserCodeStorage = require('./../../src/app/userCodes/data/staticUserCodeStorage');
const deleteUserCode = require('./../../src/app/userCodes/api/delete');
const httpMocks = require('node-mocks-http');

describe('When deleting a user code', () => {
  let req;
  let res;
  const expectedRequestCorrelationId = 'd267a0e5-8195-446d-8983-d25fafc9a925';

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      params: {
        uid: '7654321',
        code: 'ABC123',
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };
  });
  it('then a bad request is returned if the uid is not supplied', async () => {
    const uidValues = ['', undefined, null];

    await Promise.all(await uidValues.map(async (valueToUse) => {
      req.params.uid = valueToUse;

      await deleteUserCode(req, res);
      expect(res.statusCode).toBe(400);
    }));
  });
  it('then a 200 response code is returned if the uid is provided', async () => {
    await deleteUserCode(req, res);

    expect(res.statusCode).toBe(200);
  });
  it('then the params are passed to the storage provider', async () => {
    await deleteUserCode(req, res);

    expect(redisUserCodeStorage.deleteUserPasswordResetCode.mock.calls[0][0]).toBe('7654321');
    expect(redisUserCodeStorage.deleteUserPasswordResetCode.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
  });
});

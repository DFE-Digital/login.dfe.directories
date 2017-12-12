jest.mock('./../../src/infrastructure/config', () => ({
  redis: {
    url: 'http://orgs.api.test',
  },
}));

jest.mock('./../../src/app/userCodes/data/redisUserCodeStorage', () => {
  const deleteUserPasswordResetCodeStub = jest.fn();
  return {
    deleteUserPasswordResetCode: jest.fn().mockImplementation(deleteUserPasswordResetCodeStub),
  };
});

const deleteUserCode = require('./../../src/app/userCodes/api/delete');
const httpMocks = require('node-mocks-http');

describe('When deleting a user code', () => {
  let req;
  let res;

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      params: {
        uid: '7654321',
        code: 'ABC123',
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
});

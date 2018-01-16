jest.mock('./../../src/app/userCodes/data/redisUserCodeStorage', () => {
  const getUserPasswordResetCodeStub = jest.fn().mockReturnValue({ uid: '7654321', code: 'ABC123', redirectUri: 'http://local.test' });
  const createUserPasswordResetCodeStub = jest.fn().mockReturnValue({ uid: '7654321', code: 'ZXY789', redirectUri: 'http://local.test' });
  return {
    createUserPasswordResetCode: jest.fn().mockImplementation(createUserPasswordResetCodeStub),
    getUserPasswordResetCode: jest.fn().mockImplementation(getUserPasswordResetCodeStub),
  };
});
jest.mock('login.dfe.notifications.client');
jest.mock('./../../src/infrastructure/config', () => ({
  notifications: {
    connectionString: '',
  },
  userCodes: {
    redisUrl: 'http://localhost',
  },
  adapter: {
    type: 'redis',
    params: {
      redisurl: 'http://orgs.api.test',
    },
  },
}));

jest.mock('./../../src/app/user/adapter', () => {
  const findStub = jest.fn().mockReturnValue({ email: 'test@unit.local' });
  return {
    find: jest.fn().mockImplementation(findStub),
  };
});

const redisStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
const httpMocks = require('node-mocks-http');

describe('When getting a user code', () => {
  const expectedEmailAddress = 'test@unit.local';
  const expectedUuid = '7654321';
  const expectedClientId = 'client1';
  const expectedRedirectUri = 'http://localhost.test';
  const expectedRequestCorrelationId = 'abf934b4-0876-40cb-ae5c-fa5e6a3607f0';
  let req;
  let res;
  let emailObject;
  let notificationClient;
  let sendPasswordResetStub;
  let put;

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      body: {
        uid: expectedUuid,
        clientId: expectedClientId,
        redirectUri: expectedRedirectUri,
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    sendPasswordResetStub = jest.fn().mockImplementation((email, code, clientId, uid) => emailObject = {
      email, code, clientId, uid,
    });

    notificationClient = require('login.dfe.notifications.client');
    notificationClient.mockImplementation(() => ({
      sendPasswordReset: sendPasswordResetStub,
    }));

    put = require('./../../src/app/userCodes/api/putUpsertCode');
  });
  it('then a bad request is returned if the uid is not passed and the status code set to bad request', async () => {
    req.body.uid = '';

    await put(req, res);

    expect(res.statusCode).toBe(400);
  });
  it('then a bad request is returned if the client is not passed and the status code set to bad request', async () => {
    req.body.clientId = '';

    await put(req, res);

    expect(res.statusCode).toBe(400);
  });
  it('then a bad request is returned if the redirectUri is not passed', async () => {
    req.body.redirectUri = '';

    await put(req, res);

    expect(res.statusCode).toBe(400);
  });
  it('then a code is generated if the uid is supplied', async () => {
    redisStorage.getUserPasswordResetCode.mockReturnValue(null);

    await put(req, res);

    expect(res._getData().code).toBe('ZXY789');
    expect(res._getData().uid).toBe('7654321');
  });
  it('then if a code exists for a uid the same one is returned', async () => {
    redisStorage.getUserPasswordResetCode.mockReturnValue({ uid: '7654321', code: 'ABC123' });

    await put(req, res);

    expect(res._getData().code).toBe('ABC123');
    expect(res._getData().uid).toBe('7654321');
  });
  it('then an email is sent with the code', async () => {
    await put(req, res);

    expect(emailObject.code).toBe('ABC123');
    expect(emailObject.email).toBe(expectedEmailAddress);
    expect(emailObject.clientId).toBe('client1');
    expect(emailObject.uid).toBe(expectedUuid);
  });
  it('then the code is generated with the passed in parameters', async () => {
    redisStorage.getUserPasswordResetCode.mockReturnValue(null);

    await put(req, res);

    expect(redisStorage.createUserPasswordResetCode.mock.calls[0][0]).toBe(expectedUuid);
    expect(redisStorage.createUserPasswordResetCode.mock.calls[0][1]).toBe(expectedClientId);
    expect(redisStorage.createUserPasswordResetCode.mock.calls[0][2]).toBe(expectedRedirectUri);
    expect(redisStorage.createUserPasswordResetCode.mock.calls[0][3]).toBe(expectedRequestCorrelationId);
  });
});

jest.mock('./../../src/app/userCodes/data/redisUserCodeStorage', () => {
  const getUserCodeStub = jest.fn().mockImplementation((uid, codeType) => ({ uid: '7654321', code: 'ABC123', redirectUri: 'http://local.test', codeType }));
  const getUserCodeByEmailStub = jest.fn().mockImplementation((email, codeType) => ({ uid: '7654321', code: 'EDC345', redirectUri: 'http://local.test', email: 'test@unit.local', codeType }));
  const createUserCodeStub = jest.fn().mockImplementation((uid, cid, ruri, email, data, codeType) => ({ uid: '7654321', code: 'ZXY789', redirectUri: 'http://local.test', email: 'test@unit.local', codeType }));
  const updateUserCodeStub = jest.fn().mockImplementation((uid, email, data, ruri, cid) => ({ uid: '7654321', code: 'EDC345', redirectUri: 'http://local.test', email: 'test@unit.local' }));
  return {
    createUserCode: jest.fn().mockImplementation(createUserCodeStub),
    getUserCode: jest.fn().mockImplementation(getUserCodeStub),
    getUserCodeByEmail: jest.fn().mockImplementation(getUserCodeByEmailStub),
    updateUserCode: jest.fn().mockImplementation(updateUserCodeStub),
  };
});
jest.mock('login.dfe.notifications.client');
jest.mock('./../../src/infrastructure/config', () => ({
  notifications: {
    connectionString: '',
  },
  userCodes: {
    type: 'redis',
    params: {
      redisUrl: 'http://orgs.api.test',
    },
  },
  adapter: {
    type: 'redis',
    params: {
      redisurl: 'http://orgs.api.test',
    },
  },
}));
jest.mock('./../../src/infrastructure/logger', () => ({
  error: console.error,
}));
jest.mock('./../../src/app/user/adapter', () => {
  const findStub = jest.fn().mockReturnValue({ email: 'test@unit.local' });
  return {
    find: jest.fn().mockImplementation(findStub),
  };
});
jest.mock('uuid/v4');

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
  let sendConfirmMigrationEmailStub;
  let put;
  let uuid;
  let uuidStub;

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      body: {
        uid: expectedUuid,
        email: expectedEmailAddress,
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

    uuidStub = jest.fn().mockReturnValue('1dcf73dd-1613-470e-a35e-378a3375a6fe');

    uuid = require('uuid/v4');
    uuid.mockImplementation(uuidStub);

    sendPasswordResetStub = jest.fn().mockImplementation((email, code, clientId, uid) => emailObject = {
      email, code, clientId, uid, type: 'passwordreset',
    });
    sendConfirmMigrationEmailStub = jest.fn().mockImplementation((email, code, clientId, uid) => emailObject = {
      email, code, clientId, uid, type: 'migrateemail',
    });

    notificationClient = require('login.dfe.notifications.client');
    notificationClient.mockImplementation(() => ({
      sendPasswordReset: sendPasswordResetStub,
      sendConfirmMigratedEmail: sendConfirmMigrationEmailStub,
    }));

    put = require('./../../src/app/userCodes/api/putUpsertCode');
  });
  it('then a bad request is returned if the uid and email is not passed and the status code set to bad request', async () => {
    req.body.uid = '';
    req.body.email = '';

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
    req.body.email = '';
    redisStorage.getUserCode.mockReturnValue(null);

    await put(req, res);

    expect(res._getData().code).toBe('ZXY789');
    expect(res._getData().uid).toBe('7654321');
  });
  it('then if a code exists for a uid the same one is returned', async () => {
    redisStorage.getUserCode.mockImplementation((uid, codeType) => ({ uid: '7654321', code: 'ABC123', codeType }));
    redisStorage.updateUserCode.mockImplementation((uid, codeType) => ({ uid: '7654321', code: 'ABC123', codeType }));

    await put(req, res);

    expect(res._getData().code).toBe('ABC123');
    expect(res._getData().uid).toBe('7654321');
  });
  it('then an email is sent with the code', async () => {
    await put(req, res);

    expect(emailObject.code).toBe('ZXY789');
    expect(emailObject.email).toBe(expectedEmailAddress);
    expect(emailObject.clientId).toBe('client1');
    expect(emailObject.uid).toBe(expectedUuid);
    expect(emailObject.type).toBe('passwordreset');
  });
  it('then the code is generated with the passed in parameters', async () => {
    req.body.email = undefined;
    redisStorage.getUserCode.mockReturnValue(null);

    await put(req, res);

    expect(redisStorage.createUserCode.mock.calls[0][0]).toBe(expectedUuid);
    expect(redisStorage.createUserCode.mock.calls[0][1]).toBe(expectedClientId);
    expect(redisStorage.createUserCode.mock.calls[0][2]).toBe(expectedRedirectUri);
    expect(redisStorage.createUserCode.mock.calls[0][3]).toBe(undefined);
    expect(redisStorage.createUserCode.mock.calls[0][4]).toBe(undefined);
    expect(redisStorage.createUserCode.mock.calls[0][5]).toBe('PasswordReset');
    expect(redisStorage.createUserCode.mock.calls[0][6]).toBe(expectedRequestCorrelationId);
  });
  it('then if an email is passed that is checked to see if a code exists', async () => {
    req.body.uid = '';

    await put(req, res);

    expect(redisStorage.getUserCodeByEmail.mock.calls).toHaveLength(1);
  });
  it('then if the code type is migration email then the correct email is shown', async () => {
    redisStorage.getUserCode.mockReturnValue(null);
    redisStorage.updateUserCode.mockReturnValue({ uid: '7654321', code: 'EDC345', redirectUri: 'http://local.test', email: 'test@unit.local', codeType: 'confirmmigratedemail' });
    req.body.uid = '';
    req.body.codeType = 'confirmmigratedemail';

    await put(req, res);

    expect(emailObject.code).toBe('EDC345');
    expect(emailObject.code).toBe('EDC345');
    expect(emailObject.email).toBe(expectedEmailAddress);
    expect(emailObject.clientId).toBe('client1');
    expect(emailObject.uid).toBe(expectedUuid);
    expect(emailObject.type).toBe('migrateemail');
  });
  it('then if no code exists for the email then one is created', async () => {
    redisStorage.getUserCode.mockReturnValue(null);
    redisStorage.getUserCodeByEmail.mockReturnValue(null);
    req.body.uid = '';
    req.body.codeType = 'ConfirmMigratedEmail';

    await put(req, res);

    expect(redisStorage.createUserCode.mock.calls[0][0]).toBe('1dcf73dd-1613-470e-a35e-378a3375a6fe');
    expect(redisStorage.createUserCode.mock.calls[0][1]).toBe(expectedClientId);
    expect(redisStorage.createUserCode.mock.calls[0][2]).toBe(expectedRedirectUri);
    expect(redisStorage.createUserCode.mock.calls[0][3]).toBe('test@unit.local');
    expect(redisStorage.createUserCode.mock.calls[0][4]).toBe(undefined);
    expect(redisStorage.createUserCode.mock.calls[0][5]).toBe('ConfirmMigratedEmail');
    expect(redisStorage.createUserCode.mock.calls[0][6]).toBe(expectedRequestCorrelationId);
  })
});

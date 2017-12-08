jest.mock('./../../src/app/userCodes/data/redisUserCodeStorage');
jest.mock('login.dfe.notifications.client');
jest.mock('./../../src/infrastructure/config');
jest.mock('./../../src/app/user/adapter');


const httpMocks = require('node-mocks-http');

describe('When getting a user code', () => {
  const expectedEmailAddress = 'test@unit.local';
  const expectedUuid = '7654321';
  const expectedClientId = 'client1';
  const expectedRedirectUri = 'http://localhost.test';
  let req;
  let res;
  let getResponse = null;
  let emailObject;
  let redisUserCodeStorage;
  let notificationClient;
  let getUserPasswordResetCodeStub;
  let createUserPasswordResetCodeStub;
  let sendPasswordResetStub;
  let config;
  let userAdapter;
  let put;

  beforeEach(() => {
    getResponse = { uid: '7654321', code: 'ZXY789' };
    res = httpMocks.createResponse();
    req = {
      body: {
        uid: expectedUuid,
        clientId: expectedClientId,
        redirectUri: expectedRedirectUri,
      },
    };

    getUserPasswordResetCodeStub = jest.fn().mockImplementation(() => new Promise((resolve) => {
      resolve(getResponse);
    }));
    createUserPasswordResetCodeStub = jest.fn().mockImplementation(() => new Promise((resolve) => {
      resolve(getResponse);
    }));
    sendPasswordResetStub = jest.fn().mockImplementation((email, code, clientId) => emailObject = {
      email, code, clientId,
    });

    redisUserCodeStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
    redisUserCodeStorage.mockImplementation(() => ({
      getUserPasswordResetCode: getUserPasswordResetCodeStub,
      createUserPasswordResetCode: createUserPasswordResetCodeStub,
    }));

    notificationClient = require('login.dfe.notifications.client');
    notificationClient.mockImplementation(() => ({
      sendPasswordReset: sendPasswordResetStub,
    }));

    config = require('./../../src/infrastructure/config');
    config.mockImplementation(() => ({
      notifications: {
        connectionString: '',
      },
    }));

    userAdapter = require('./../../src/app/user/adapter');
    userAdapter.mockImplementation(() => ({
      find() {
        return { email: expectedEmailAddress };
      },
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
    getUserPasswordResetCodeStub = jest.fn().mockImplementation(() => new Promise((resolve) => {
      resolve(null);
    }));

    await put(req, res);

    expect(res._getData().code).toBe('ZXY789');
    expect(res._getData().uid).toBe('7654321');
  });
  it('then if a code exists for a uid the same one is returned', async () => {
    getUserPasswordResetCodeStub = jest.fn().mockImplementation(() => new Promise((resolve) => {
      resolve({ uid: '7654321', code: 'ABC123' });
    }));

    await put(req, res);

    expect(res._getData().code).toBe('ABC123');
    expect(res._getData().uid).toBe('7654321');
  });
  it('then an email is sent with the code', async () => {
    await put(req, res);

    expect(emailObject.code).toBe('ZXY789');
    expect(emailObject.email).toBe(expectedEmailAddress);
    expect(emailObject.clientId).toBe('client1');
  });
  it('then the code is generated with the passed in parameters', async () => {
    getUserPasswordResetCodeStub = jest.fn().mockImplementation(() => new Promise((resolve) => {
      resolve(null);
    }));

    await put(req, res);

    expect(createUserPasswordResetCodeStub.mock.calls[0][0]).toBe(expectedUuid);
    expect(createUserPasswordResetCodeStub.mock.calls[0][1]).toBe(expectedClientId);
    expect(createUserPasswordResetCodeStub.mock.calls[0][2]).toBe(expectedRedirectUri);
  });
});

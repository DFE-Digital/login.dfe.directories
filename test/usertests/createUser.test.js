jest.mock('login.dfe.service-notifications.jobs.client');
jest.mock('./../../src/app/user/adapter', () => ({
  findByUsername: jest.fn(),
  create: jest.fn(),
}));
jest.mock('./../../src/infrastructure/logger', () => {
  return {};
});
jest.mock('./../../src/infrastructure/config', () => {
  return {
    notifications: {
      connectionString: 'notifications-connection-string',
    },
    toggles: {
      notificationsEnabled: true,
    },
  };
});

const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');
const { findByUsername, create } = require('./../../src/app/user/adapter');
const createUser = require('./../../src/app/user/api/createUser');
const httpMocks = require('node-mocks-http');

const newUser = {
  sub: 'some-new-id',
  password: 'somepassword',
  status: 1,
};
const serviceNotificationsClient = {
  notifyUserUpdated: jest.fn(),
};

describe('When creating a user', () => {
  let req;
  let res;
  const expectedRequestCorrelationId = 'some-correlation-id';

  beforeEach(() => {
    req = {
      params: {
        id: 'a516696c-168c-4680-8dfb-1512d6fc234c',
      },
      body: {
        email: 'test@local',
        password: 'password-test',
        firstName: 'Test',
        lastName: 'Tester',
        phone_number: '07700 900000',
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    res = httpMocks.createResponse();

    findByUsername.mockReset().mockReturnValue(null);
    create.mockReset().mockReturnValue(newUser);

    serviceNotificationsClient.notifyUserUpdated.mockReset();
    ServiceNotificationsClient.mockReset().mockImplementation(() => serviceNotificationsClient);
  });
  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });
  it('then if the params are missing a bad request is returned', async () => {
    req.body.email = '';

    await createUser(req, res);

    expect(res.statusCode).toBe(400);
  });
  it('then if a user already exists with that user a conflict error is returned', async () => {
    findByUsername.mockReturnValue({ email: 'some@local' });

    await createUser(req, res);

    expect(findByUsername.mock.calls).toHaveLength(1);
    expect(findByUsername.mock.calls[0][0]).toBe(req.body.email);
    expect(findByUsername.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
    expect(res.statusCode).toBe(409);
  });
  it('then if the request is valid then the call is made to the repository to create the user', async () => {
    await createUser(req, res);

    expect(create.mock.calls).toHaveLength(1);
    expect(create.mock.calls[0][0]).toBe(req.body.email);
    expect(create.mock.calls[0][1]).toBe(req.body.password);
    expect(create.mock.calls[0][2]).toBe(req.body.firstName);
    expect(create.mock.calls[0][3]).toBe(req.body.lastName);
    expect(create.mock.calls[0][5]).toBe(req.body.phone_number);
    expect(create.mock.calls[0][6]).toBe(expectedRequestCorrelationId);
  });
  it('then if the legacy_username is provided in the body it is passed to the repository', async () => {
    req.body.legacy_username = '123asd';

    await createUser(req, res);

    expect(create.mock.calls).toHaveLength(1);
    expect(create.mock.calls[0][4]).toBe(req.body.legacy_username);
  });
  it('then the user is returned in the response', async () => {
    await createUser(req, res);

    expect(res._getData().sub).toBe('some-new-id');
    expect(res._getData().password).toBe(undefined);
  });
  it('then a user updated notification is sent', async () => {
    await createUser(req, res);

    expect(ServiceNotificationsClient).toHaveBeenCalledTimes(1);
    expect(ServiceNotificationsClient).toHaveBeenCalledWith({ connectionString: 'notifications-connection-string' });
    expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledTimes(1);
    expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledWith(Object.assign({}, newUser, { status: newUser.status, password: undefined }));
  });
});

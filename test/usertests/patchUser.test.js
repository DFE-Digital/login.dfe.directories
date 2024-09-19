jest.mock('login.dfe.service-notifications.jobs.client');
jest.mock('./../../src/app/user/adapter', () => ({
  find: jest.fn(),
  update: jest.fn(),
}));

jest.mock('./../../src/utils/deprecateMiddleware', () => {
});

jest.mock('./../../src/infrastructure/config', () => ({
  notifications: {
    connectionString: 'notifications-connection-string',
  },
  toggles: {
    notificationsEnabled: true,
  },
}));

jest.mock('./../../src/infrastructure/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');
const httpMocks = require('node-mocks-http');
const { find, update } = require('../../src/app/user/adapter');
const patchUser = require('../../src/app/user/api/patchUser');
const logger = require('../../src/infrastructure/logger');

const serviceNotificationsClient = {
  notifyUserUpdated: jest.fn(),
};

describe('When patching a user', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      header: () => 'correlation-id',
      params: {
        id: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      },
      body: {
        given_name: 'Jennifer',
        family_name: 'Potter',
        email: 'jenny.potter@dumbledores-army.test',
        phone_number: '07700 900000',
        job_title: 'Manager',
        legacyUsernames: ['luser1', 'luser2'],
      },
      externalAuth: {
        changeName: jest.fn(),
        changeEmail: jest.fn(),
      },
    };

    res = httpMocks.createResponse();

    find.mockReset();
    find.mockReturnValue({
      id: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      sub: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      given_name: 'Jenny',
      family_name: 'Weasley',
      email: 'jenny.weasley@dumbledores-army.test',
      job_title: 'Manager',
      password: 'some-hashed-data',
      salt: 'random-salt-value',
      status: 1,
    });

    update.mockReset();

    serviceNotificationsClient.notifyUserUpdated.mockReset();
    ServiceNotificationsClient.mockReset().mockImplementation(() => serviceNotificationsClient);
  });

  it('then it should get user from storage', async () => {
    await patchUser(req, res);

    expect(find.mock.calls).toHaveLength(1);
    expect(find.mock.calls[0][0]).toBe('9b543631-884c-4b39-86d5-311ad5fc6cce');
    expect(find.mock.calls[0][1]).toBe('correlation-id');
  });

  it('then it should send 404 if user not found', async () => {
    find.mockReturnValue(null);

    await patchUser(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should update user in storage with new details', async () => {
    await patchUser(req, res);

    expect(update.mock.calls).toHaveLength(1);
    expect(update.mock.calls[0][0]).toBe('9b543631-884c-4b39-86d5-311ad5fc6cce');
    expect(update.mock.calls[0][1]).toBe('Jennifer');
    expect(update.mock.calls[0][2]).toBe('Potter');
    expect(update.mock.calls[0][3]).toBe('jenny.potter@dumbledores-army.test');
    expect(update.mock.calls[0][4]).toBe('Manager');
    expect(update.mock.calls[0][5]).toBe('07700 900000');
    expect(update.mock.calls[0][6]).toEqual(['luser1', 'luser2']);
    expect(update.mock.calls[0][7]).toBe('correlation-id');
  });

  it('then it should send 400 with error message if body has unknown property', async () => {
    req.body.bad = 'value';

    await patchUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toBe('Unpatchable property bad. Allowed properties given_name,family_name,email,job_title,phone_number,legacyUsernames');
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 400 with error message if body has unpatchable property', async () => {
    req.body.sub = 'value';

    await patchUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toBe('Unpatchable property sub. Allowed properties given_name,family_name,email,job_title,phone_number,legacyUsernames');
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 400 with error message if body has no properties', async () => {
    req.body = {};

    await patchUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toBe('Must specify at least one property to update. Allowed properties given_name,family_name,email,job_title,phone_number,legacyUsernames');
    expect(res._isEndCalled()).toBe(true);
  });

  it('then a user updated notification is sent', async () => {
    await patchUser(req, res);

    expect(ServiceNotificationsClient).toHaveBeenCalledTimes(1);
    expect(ServiceNotificationsClient).toHaveBeenCalledWith({ connectionString: 'notifications-connection-string' });
    expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledTimes(1);
    expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledWith({
      id: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      sub: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      given_name: 'Jennifer',
      family_name: 'Potter',
      job_title: 'Manager',
      email: 'jenny.potter@dumbledores-army.test',
      phone_number: '07700 900000',
      status: 1,
    });
  });

  it('should use not call any entra-auth-extensions when the user has is_entra flag and neither name or email has changed', async () => {
    find.mockReturnValue({
      id: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      sub: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      given_name: 'Jennifer',
      family_name: 'Potter',
      email: 'jenny.potter@dumbledores-army.test',
      status: 1,
      is_entra: true,
      entra_oid: 'mock-entra-oid',
    });

    await patchUser(req, res);
    expect(req.externalAuth.changeName).toHaveBeenCalledTimes(0);
    expect(req.externalAuth.changeEmail).toHaveBeenCalledTimes(0);
    expect(res.statusCode).toBe(202);
  });

  it('should only call entra-auth-extensions.changeName when the user has is_entra flag and only their name has changed', async () => {
    find.mockReturnValue({
      id: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      sub: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      given_name: 'Jennifer',
      family_name: 'Weasley',
      email: 'jenny.potter@dumbledores-army.test',
      job_title: 'Manager',
      password: 'some-hashed-data',
      salt: 'random-salt-value',
      status: 1,
      is_entra: true,
      entra_oid: 'mock-entra-oid',
    });

    await patchUser(req, res);
    expect(req.externalAuth.changeName).toHaveBeenCalledWith({
      userId: 'mock-entra-oid',
      firstName: 'Jennifer',
      lastName: 'Potter',
    });

    expect(req.externalAuth.changeEmail).toHaveBeenCalledTimes(0);
    expect(res.statusCode).toBe(202);
  });

  it('should only call entra-auth-extensions.changeName and handle an error when the user has is_entra flag and their name has changed', async () => {
    find.mockReturnValue({
      id: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      sub: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      given_name: 'Jennifer',
      family_name: 'Weasley',
      email: 'jenny.potter@dumbledores-army.test',
      job_title: 'Manager',
      password: 'some-hashed-data',
      salt: 'random-salt-value',
      status: 1,
      is_entra: true,
      entra_oid: 'mock-entra-oid',
    });
    req.externalAuth.changeName.mockReset();
    req.externalAuth.changeName = () => { throw new Error('mock-error'); };

    await patchUser(req, res);

    expect(update.mock.calls[0][0]).toBe('9b543631-884c-4b39-86d5-311ad5fc6cce');
    expect(update.mock.calls[0][1]).toBe('Jennifer');
    expect(update.mock.calls[0][2]).toBe('Potter');
    expect(update.mock.calls[0][3]).toBe('jenny.potter@dumbledores-army.test');
    expect(update.mock.calls[0][4]).toBe('Manager');
    expect(update.mock.calls[0][5]).toBe('07700 900000');
    expect(update.mock.calls[0][6]).toEqual(['luser1', 'luser2']);
    expect(update.mock.calls[0][7]).toBe('correlation-id');

    expect(req.externalAuth.changeEmail).toHaveBeenCalledTimes(0);

    expect(logger.error).toHaveBeenCalledWith(
      'patchUser req.externalAuth.changeName failed for user \'9b543631-884c-4b39-86d5-311ad5fc6cce\' with entraOid mock-entra-oid for the reason(s) Error: mock-error (correlationId: \'correlation-id\')',
      { correlationId: 'correlation-id' },
    );

    expect(res.statusCode).toBe(500);
  });

  it('should only call entra-auth-extensions.changeEmail and handle an error when the user has is_entra flag and their email has changed', async () => {
    find.mockReturnValue({
      id: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      sub: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      given_name: 'Jennifer',
      family_name: 'Potter',
      email: 'jenny.Weasley@dumbledores-army.test',
      job_title: 'Manager',
      password: 'some-hashed-data',
      salt: 'random-salt-value',
      status: 1,
      is_entra: true,
      entra_oid: 'mock-entra-oid',
    });
    req.externalAuth.changeEmail.mockReset();
    req.externalAuth.changeEmail = () => { throw new Error('mock-error'); };

    await patchUser(req, res);

    expect(update.mock.calls[0][0]).toBe('9b543631-884c-4b39-86d5-311ad5fc6cce');
    expect(update.mock.calls[0][1]).toBe('Jennifer');
    expect(update.mock.calls[0][2]).toBe('Potter');
    expect(update.mock.calls[0][3]).toBe('jenny.potter@dumbledores-army.test');
    expect(update.mock.calls[0][4]).toBe('Manager');
    expect(update.mock.calls[0][5]).toBe('07700 900000');
    expect(update.mock.calls[0][6]).toEqual(['luser1', 'luser2']);
    expect(update.mock.calls[0][7]).toBe('correlation-id');
    expect(req.externalAuth.changeName).toHaveBeenCalledTimes(0);
    expect(logger.error).toHaveBeenCalledWith(
      'patchUser req.externalAuth.changeEmail failed for user \'9b543631-884c-4b39-86d5-311ad5fc6cce\' with entraOid mock-entra-oid for the reason(s) Error: mock-error (correlationId: \'correlation-id\')',
      { correlationId: 'correlation-id' },
    );

    expect(res.statusCode).toBe(500);
  });

  it('should only call entra-auth-extensions.changeEmail when the user has is_entra flag and their email has changed', async () => {
    find.mockReturnValue({
      id: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      sub: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      given_name: 'Jennifer',
      family_name: 'Potter',
      email: 'jenny.weasley@dumbledores-army.test',
      job_title: 'Manager',
      password: 'some-hashed-data',
      salt: 'random-salt-value',
      status: 1,
      is_entra: true,
      entra_oid: 'mock-entra-oid',
    });

    await patchUser(req, res);
    expect(req.externalAuth.changeEmail).toHaveBeenCalledWith({
      userId: 'mock-entra-oid',
      emailAddress: 'jenny.potter@dumbledores-army.test',
    });

    expect(req.externalAuth.changeName).toHaveBeenCalledTimes(0);
    expect(res.statusCode).toBe(202);
  });
});

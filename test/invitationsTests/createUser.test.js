const { PublicApiClient, ServiceNotificationsClient } = require('login.dfe.jobs-client');
const httpMocks = require('node-mocks-http');
const createUser = require('../../src/app/invitations/api/createUser');
const { getUserInvitation, updateInvitation } = require('../../src/app/invitations/data/index');
const userStorage = require('../../src/app/user/adapter');
const { safeUser } = require('../../src/utils/index');
const logger = require('../../src/infrastructure/logger');

jest.mock('../../src/infrastructure/config', () => ({
  loggerSettings: {
    applicationName: 'Directories API Test',
  },
  hostingEnvironment: {},
  adapter: {
    type: 'sequelize',
    params: {
      host: 'test-host',
      username: 'test',
      password: 'test-password',
      dialect: 'mssql',
    },
  },
  invitations: {
    type: 'sequelize',
  },
  notifications: {
    connectionString: 'test',
  },
}));
jest.mock('../../src/infrastructure/logger');
jest.mock('../../src/app/invitations/data/index');
jest.mock('../../src/app/user/adapter');
jest.mock('../../src/utils/index', () => ({
  safeUser: jest.fn(),
}));
jest.mock('login.dfe.jobs-client');
jest.mock('sequelize');
jest.mock('../../src/infrastructure/repository/db', () => ({
  user: {
    create: jest.fn().mockResolvedValue({ entra_linked: new Date() }),
    findOne: jest.fn(),
  },
  userPasswordPolicy: { create: jest.fn() },
  userLegacyUsername: { create: jest.fn() },
}));

const serviceNotificationsClient = {
  notifyUserUpdated: jest.fn(),
};
const publicApiClient = {
  sendInvitationComplete: jest.fn(),
};

describe('createUser', () => {
  let req;
  let res;
  let safeUserMock;
  let resSendSpy;

  beforeEach(() => {
    req = {
      params: { id: 'inv-id' },
      body: { password: 'password' },
      header: jest.fn(),
    };
    res = httpMocks.createResponse();

    safeUserMock = {
      id: 'user-id',
      email: 'john.doe@test.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    safeUser.mockReturnValue(safeUserMock);

    resSendSpy = jest.spyOn(res, 'send');

    serviceNotificationsClient.notifyUserUpdated.mockReset();
    ServiceNotificationsClient.mockReset().mockImplementation(() => serviceNotificationsClient);
    publicApiClient.sendInvitationComplete.mockReset();
    PublicApiClient.mockReset().mockImplementation(() => publicApiClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should respond with a 400 status code when the invitation ID is missing from the request parameters.', async () => {
    req.params.id = undefined;

    await createUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(resSendSpy).toHaveBeenCalledWith();
  });

  it('should respond with a 400 status code if both password and entraOid are provided', async () => {
    req.body = { password: 'password', entraOid: 'oid' };

    await createUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(resSendSpy).toHaveBeenCalledWith({ message: 'Provide either password or entraOid, but not both or neither' });
  });

  it('should respond with a 400 status code if neither password nor entraOid is provided', async () => {
    req.body = { };

    await createUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(resSendSpy).toHaveBeenCalledWith({ message: 'Provide either password or entraOid, but not both or neither' });
  });

  it('should respond with a 404 status code if no invitation is found for the invitation id', async () => {
    req.header.mockReturnValue('correlation-id');
    getUserInvitation.mockResolvedValue(undefined);

    await createUser(req, res);

    expect(res.statusCode).toBe(404);
    expect(resSendSpy).toHaveBeenCalledWith();
  });

  it('should return 201 status code and the safe user data if everything is successful', async () => {
    const invitation = {
      email: 'john.doe@test.com',
      firstName: 'John',
      lastName: 'Doe',
      callbacks: 'http:test/auth/cb',
    };
    const user = {
      id: 'user-id',
      email: 'john.doe@test.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'test-password',
    };

    req.header.mockReturnValue('correlation-id');
    getUserInvitation.mockResolvedValue(invitation);
    userStorage.create.mockResolvedValue(user);

    await createUser(req, res);

    expect(userStorage.create).toHaveBeenCalledWith('john.doe@test.com', 'password', 'John', 'Doe', null, null, 'correlation-id', undefined);
    expect(updateInvitation).toHaveBeenCalledWith({ ...invitation, isCompleted: true, userId: 'user-id' });
    expect(safeUser).toHaveBeenCalled();
    expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledTimes(1);
    expect(publicApiClient.sendInvitationComplete).toHaveBeenCalledWith('user-id', 'http:test/auth/cb');
    expect(res.statusCode).toBe(201);
    expect(resSendSpy).toHaveBeenCalledWith(safeUserMock);
  });

  it('should return 500 if an error is thrown', async () => {
    req.params.id = '123';
    req.body = { password: 'pass' };
    req.header.mockReturnValue('correlation-id');
    getUserInvitation.mockRejectedValue(new Error('Test error'));

    await createUser(req, res);

    expect(logger.error).toHaveBeenCalledWith(expect.any(Error));
    expect(res.statusCode).toBe(500);
    expect(res.send).toHaveBeenCalledWith('Test error');
  });
});

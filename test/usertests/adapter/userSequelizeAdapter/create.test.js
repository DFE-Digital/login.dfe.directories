const { v4: uuid } = require('uuid');
const { hashPassword, getLatestPolicyCode } = require('login.dfe.password-policy');

const { create } = require('../../../../src/app/user/adapter/UserSequelizeAdapter');
const { findByUsernameHelper } = require('../../../../src/app/user/adapter/userSequelizeHelpers/findByUsernameHelper');
const generateSalt = require('../../../../src/app/user/utils/generateSalt');
const db = require('../../../../src/infrastructure/repository/db');

jest.mock('../../../../src/app/user/adapter/userSequelizeHelpers/findByUsernameHelper', () => ({
  findByUsernameHelper: jest.fn(),
}));

jest.mock('../../../../src/infrastructure/repository/db', () => ({
  user: {
    create: jest.fn().mockResolvedValue({ entra_linked: new Date() }),
    findOne: jest.fn(),
  },
  userPasswordPolicy: { create: jest.fn() },
  userLegacyUsername: { create: jest.fn() },
}));
jest.mock('../../../../src/infrastructure/config', () => ({
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
}));
jest.mock('uuid');
jest.mock('../../../../src/app/user/utils/generateSalt');
jest.mock('login.dfe.password-policy', () => ({
  getLatestPolicyCode: jest.fn(() => 'v3'),
  hashPassword: jest.fn(),
}));

jest.mock('sequelize');

describe('userSequelizeAdapter.create', () => {
  beforeEach(() => {
    uuid.mockReturnValue('newId');
    generateSalt.mockReturnValue('salt');
    hashPassword.mockResolvedValue('hashedPassword');
    getLatestPolicyCode.mockReturnValue('v3');
    findByUsernameHelper.mockResolvedValue(null);
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should return null if username is missing', async () => {
    const result = await create(null, 'password', 'John', 'Doe', null, null, 'correlationId', false, null);
    expect(result).toBeNull();
  });

  it('should return null if username and password and entraOid are missing', async () => {
    const result = await create(null, null, 'John', 'Doe', 'legacyUsername', '1234567890', 'correlationId', false, null);
    expect(result).toBeNull();
  });

  it('should return null if username is present but password and entrOid are missing', async () => {
    const result = await create('john.doe@test.com', null, 'John', 'Doe', 'legacyUsername', '1234567890', 'correlationId', false, null);
    expect(result).toBeNull();
  });

  it('should return null if username, password and entraOid are all present', async () => {
    const result = await create('john.doe@test.com', 'password', 'John', 'Doe', 'legacyUsername', '1234567890', 'correlationId', false, 'entraOid');
    expect(result).toBeNull();
  });

  it('should return the existing user record if already exists', async () => {
    const existingUserRecord = {
      given_name: 'Test',
      family_name: 'User',
    };
    findByUsernameHelper.mockResolvedValue(existingUserRecord);
    const result = await create('john.doe@test.com', 'password', 'John', 'Doe', null, null, 'correlationId', false, undefined);
    expect(result).toBe(existingUserRecord);
  });

  it('should create a new user with hashed password and entra `is_entra` flag set to `false` when `entraOid` is not provided', async () => {
    const newUser = {
      id: 'newId',
      sub: 'newId',
      given_name: 'John',
      family_name: 'Doe',
      email: 'john.doe@test.com',
      salt: 'salt',
      password: 'hashedPassword',
      status: 1,
      phone_number: null,
      isMigrated: false,
      password_reset_required: false,
      is_entra: false,
      entra_oid: null,
      entra_linked: null,
    };

    db.user.create.mockResolvedValue({ sub: 'newId', entra_linked: null });

    const result = await create('john.doe@test.com', 'password', 'John', 'Doe', null, null, 'correlationId', false, undefined);
    expect(generateSalt).toHaveBeenCalled();
    expect(hashPassword).toHaveBeenCalled();
    expect(hashPassword).toHaveBeenCalledWith('v3', 'password', 'salt');
    expect(db.user.create).toHaveBeenCalled();
    expect(db.user.create).toHaveBeenCalledWith(newUser);

    expect(result).toEqual({ ...newUser, id: 'newId', entra_linked: null });
  });

  it('should create a new user with hashed password and entra `is_entra` flag set to `true` and password `none` when `entraOid` is provided', async () => {
    const newUser = {
      id: 'newId',
      sub: 'newId',
      given_name: 'John',
      family_name: 'Doe',
      email: 'john.doe@test.com',
      salt: 'salt',
      password: 'none',
      status: 1,
      phone_number: null,
      isMigrated: false,
      password_reset_required: false,
      is_entra: true,
      entra_oid: 'entraId',
      entra_linked: new Date('2024-08-02T09:56:39.890Z'),
    };

    db.user.create.mockResolvedValue(newUser);

    const result = await create('john.doe@test.com', undefined, 'John', 'Doe', undefined, null, 'correlationId', false, 'entraId');

    expect(generateSalt).toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
    expect(db.user.create).toHaveBeenCalled();
    expect(db.user.create).toHaveBeenCalledWith(newUser);
    expect(db.userPasswordPolicy.create).toHaveBeenCalled();

    expect(result).toEqual({ ...newUser, id: 'newId', entra_linked: new Date('2024-08-02T09:56:39.890Z') });
  });

  it('should create a ne entry into the `user_legacy_username` table if legacy username is provided', async () => {
    await create('john.doe@test.com', 'password', 'John', 'Doe', 'johnDoeLegacyUsername', null, 'correlationId', false, undefined);

    expect(db.userLegacyUsername.create).toHaveBeenCalledWith({ legacy_username: 'johnDoeLegacyUsername', uid: 'newId' });
  });
});

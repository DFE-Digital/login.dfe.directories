const { updateLastLogin } = require('../../../../src/app/user/adapter/UserSequelizeAdapter');
const db = require('../../../../src/infrastructure/repository/db');
const logger = require('../../../../src/infrastructure/logger');

jest.mock('../../../../src/infrastructure/logger', () => ({
  error: jest.fn(),
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

jest.mock('sequelize');

jest.mock('../../../../src/infrastructure/repository/db', () => ({
  user: {
    sequelize: {
      query: jest.fn(),
      QueryTypes: {
        UPDATE: 'UPDATE',
      },
    },
  },
  userPasswordPolicy: { create: jest.fn() },
  userLegacyUsername: { create: jest.fn() },
}));

describe('userSequelizeAdapter.updateUserLastLogin', () => {
  beforeEach(() => {});

  it('should construct the correct sql query', async () => {
    await updateLastLogin('mock-uid', 'mock-correlation-id');

    expect(db.user.sequelize.query.mock.calls[0][0]).toBe(`UPDATE [user]
        SET
          prev_login = CASE WHEN last_login is not null THEN last_login ELSE GETUTCDATE() END,
          last_login = GETUTCDATE()
        WHERE
          sub = :user_id`);

    expect(db.user.sequelize.query.mock.calls[0][1]).toMatchObject({ replacements: { user_id: 'mock-uid' }, type: 'UPDATE' });
  });

  it('should log any error and throw', async () => {
    db.user.sequelize.query.mockReset();
    db.user.sequelize.query.mockImplementation(() => {
      throw new Error('mock-error');
    });

    await expect(updateLastLogin('mock-uid', 'mock-correlation-id')).rejects.toThrow('mock-error');
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});

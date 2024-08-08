jest.mock('../../../../../src/infrastructure/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../../../../src/infrastructure/repository/db', () => ({
  user: {
    findOne: jest.fn(),
  },
}));

const Sequelize = require('sequelize');
const { findByUsernameHelper } = require('../../../../../src/app/user/adapter/userSequelizeHelpers/findByUsernameHelper');
const logger = require('../../../../../src/infrastructure/logger');
const db = require('../../../../../src/infrastructure/repository/db');

const { Op } = Sequelize;

describe('findByUsernameHelper function', () => {
  const correlationId = 'testCorrelationId';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user entity when a user is found', async () => {
    const username = 'test@example.com';
    const userEntity = { id: 1, email: username };

    db.user.findOne.mockResolvedValue(userEntity);

    const result = await findByUsernameHelper(username, correlationId);

    expect(logger.info).toHaveBeenCalledWith('Get user for request', { correlationId });
    expect(db.user.findOne).toHaveBeenCalledWith({
      tableHint: 'NOLOCK',
      where: {
        email: {
          [Op.eq]: username,
        },
      },
    });
    expect(result).toEqual(userEntity);
  });

  it('should return null when no user is found', async () => {
    const username = 'nonexistent@example.com';

    db.user.findOne.mockResolvedValue(null);

    const result = await findByUsernameHelper(username, correlationId);

    expect(logger.info).toHaveBeenCalledWith('Get user for request', { correlationId });
    expect(db.user.findOne).toHaveBeenCalledWith({
      tableHint: 'NOLOCK',
      where: {
        email: {
          [Op.eq]: username,
        },
      },
    });
    expect(result).toBeNull();
  });

  it('should log an error and throw if there is a database error', async () => {
    const username = 'test@example.com';
    const errorMessage = 'Database error';

    db.user.findOne.mockRejectedValue(new Error(errorMessage));

    await expect(findByUsernameHelper(username, correlationId)).rejects.toThrow(errorMessage);

    expect(logger.info).toHaveBeenCalledWith('Get user for request', { correlationId });
    expect(logger.error).toHaveBeenCalledWith(
      `error getting user with username - ${errorMessage} for request ${correlationId} error: Error: ${errorMessage}`,
      { correlationId },
    );
    expect(db.user.findOne).toHaveBeenCalledWith({
      tableHint: 'NOLOCK',
      where: {
        email: {
          [Op.eq]: username,
        },
      },
    });
  });
});

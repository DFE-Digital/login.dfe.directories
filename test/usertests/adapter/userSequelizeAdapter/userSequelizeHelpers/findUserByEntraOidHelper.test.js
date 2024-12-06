jest.mock("../../../../../src/infrastructure/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../../../../../src/infrastructure/repository/db", () => ({
  user: {
    findOne: jest.fn(),
  },
}));

const Sequelize = require("sequelize");
const findUserByEntraOidHelper = require("../../../../../src/app/user/adapter/userSequelizeHelpers/findUserByEntraOidHelper");
const logger = require("../../../../../src/infrastructure/logger");
const db = require("../../../../../src/infrastructure/repository/db");

const { Op } = Sequelize;

describe("findUserByEntraOidHelper function", () => {
  const correlationId = "testCorrelationId";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return user entity when a user is found", async () => {
    const entraOid = "78071717-4247-480d-90a3-3d531379ebf8";
    const userEntity = { id: 1, entraOid };

    db.user.findOne.mockResolvedValue(userEntity);

    const result = await findUserByEntraOidHelper(entraOid, correlationId);

    expect(logger.info).toHaveBeenCalledWith(
      "Get user by entraOid for request",
      { correlationId },
    );
    expect(db.user.findOne).toHaveBeenCalledWith({
      tableHint: "NOLOCK",
      where: {
        entra_oid: {
          [Op.eq]: entraOid,
        },
      },
    });
    expect(result).toEqual(userEntity);
  });

  it("should return null when no user is found", async () => {
    const entraOid = "78071717-4247-480d-90a3-3d531379ebf8";

    db.user.findOne.mockResolvedValue(null);

    const result = await findUserByEntraOidHelper(entraOid, correlationId);

    expect(logger.info).toHaveBeenCalledWith(
      "Get user by entraOid for request",
      { correlationId },
    );
    expect(db.user.findOne).toHaveBeenCalledWith({
      tableHint: "NOLOCK",
      where: {
        entra_oid: {
          [Op.eq]: entraOid,
        },
      },
    });
    expect(result).toBeNull();
  });

  it("should log an error and throw if there is a database error", async () => {
    const entraOid = "78071717-4247-480d-90a3-3d531379ebf8";
    const errorMessage = "Database error";

    db.user.findOne.mockRejectedValue(new Error(errorMessage));

    await expect(
      findUserByEntraOidHelper(entraOid, correlationId),
    ).rejects.toThrow(errorMessage);

    expect(logger.info).toHaveBeenCalledWith(
      "Get user by entraOid for request",
      { correlationId },
    );
    expect(logger.error).toHaveBeenCalledWith(
      `error getting user with entraOid - ${errorMessage} for request ${correlationId} error: Error: ${errorMessage}`,
      { correlationId },
    );
    expect(db.user.findOne).toHaveBeenCalledWith({
      tableHint: "NOLOCK",
      where: {
        entra_oid: {
          [Op.eq]: entraOid,
        },
      },
    });
  });
});

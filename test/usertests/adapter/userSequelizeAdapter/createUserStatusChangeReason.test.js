const { v4: uuid } = require("uuid");
const logger = require("../../../../src/infrastructure/logger");

const {
  createUserStatusChangeReason,
} = require("../../../../src/app/user/adapter/UserSequelizeAdapter");
const db = require("../../../../src/infrastructure/repository/db");

jest.mock("../../../../src/infrastructure/repository/db", () => ({
  user: {
    findOne: jest.fn(),
  },
  userStatusChangeReasons: { create: jest.fn() },
}));
jest.mock("../../../../src/infrastructure/logger", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));
jest.mock("../../../../src/infrastructure/config", () => ({
  loggerSettings: {
    applicationName: "Directories API Test",
  },
  hostingEnvironment: {},
  adapter: {
    type: "sequelize",
    params: {
      host: "test-host",
      username: "test",
      password: "test-password",
      dialect: "mssql",
    },
  },
}));
jest.mock("uuid");
jest.mock("sequelize");

const userId = "user-1";
const oldStatus = 1;
const newStatus = 0;
const reason = "Test reason";
const correlationId = "correlationId";

describe("userSequelizeAdapter.create", () => {
  beforeEach(() => {
    uuid.mockReturnValue("newId");
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("should return null if user not found", async () => {
    const result = await createUserStatusChangeReason(
      userId,
      oldStatus,
      newStatus,
      reason,
      correlationId,
    );
    expect(result).toBeNull();
  });

  it("should return the created row if user found and creation was successful", async () => {
    db.user.findOne.mockReturnValue({
      sub: userId,
      email: "test@test.com",
    });
    const result = await createUserStatusChangeReason(
      userId,
      oldStatus,
      newStatus,
      reason,
      correlationId,
    );
    expect(result).toStrictEqual({
      id: "newId",
      user_id: userId,
      old_status: oldStatus,
      new_status: newStatus,
      reason,
    });
  });

  it("should log and throw an error if create operation on userStatusChangeReasons fails ", async () => {
    db.user.findOne.mockReturnValue({
      sub: userId,
      email: "test@test.com",
    });
    const error = new Error("Sequelize error");
    db.userStatusChangeReasons.create.mockRejectedValue(error);

    await expect(
      createUserStatusChangeReason(
        userId,
        oldStatus,
        newStatus,
        reason,
        correlationId,
      ),
    ).rejects.toThrow(error);

    expect(logger.error).toHaveBeenCalledWith(
      `Create user status change reason row failed - Sequelize error for request correlationId error: Error: Sequelize error`,
      { correlationId },
    );
  });
});

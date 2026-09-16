const {
  changeStatus,
} = require("../../../../src/app/user/adapter/UserSequelizeAdapter");
const db = require("../../../../src/infrastructure/repository/db");

jest.mock("../../../../src/infrastructure/repository/db", () => ({
  user: {
    findOne: jest.fn(),
  },
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
jest.mock("sequelize");

const userId = "user-1";
const correlationId = "correlationId";

describe("userSequelizeAdapter.changeStatus", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return null if user not found", async () => {
    db.user.findOne.mockReturnValue(null);

    const result = await changeStatus(userId, 0, correlationId);

    expect(result).toBeNull();
  });

  it("should stamp deactivated_at when the user is deactivated", async () => {
    const update = jest.fn();
    const userEntity = { sub: userId, update };
    db.user.findOne.mockReturnValue(userEntity);

    await changeStatus(userId, 0, correlationId);

    expect(update).toHaveBeenCalledWith({
      status: 0,
      deactivated_at: expect.any(String),
    });
  });

  it("should preserve the existing deactivated_at when the user is already deactivated", async () => {
    const update = jest.fn();
    const existingDeactivatedAt = new Date("2026-01-01T00:00:00.000Z");
    const userEntity = {
      sub: userId,
      deactivated_at: existingDeactivatedAt,
      update,
    };
    db.user.findOne.mockReturnValue(userEntity);

    await changeStatus(userId, 0, correlationId);

    expect(update).toHaveBeenCalledWith({
      status: 0,
      deactivated_at: existingDeactivatedAt,
    });
  });

  it("should clear deactivated_at when the user is reactivated", async () => {
    const update = jest.fn();
    const userEntity = { sub: userId, update };
    db.user.findOne.mockReturnValue(userEntity);

    await changeStatus(userId, 1, correlationId);

    expect(update).toHaveBeenCalledWith({
      status: 1,
      deactivated_at: null,
    });
  });
});

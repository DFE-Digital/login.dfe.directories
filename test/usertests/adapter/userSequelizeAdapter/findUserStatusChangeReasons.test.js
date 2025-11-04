const {
  findUserStatusChangeReasons,
} = require("../../../../src/app/user/adapter/UserSequelizeAdapter");
const db = require("../../../../src/infrastructure/repository/db");

jest.mock(
  "../../../../src/app/user/adapter/userSequelizeHelpers/findByUsernameHelper",
  () => ({
    findByUsernameHelper: jest.fn(),
  }),
);
jest.mock("../../../../src/infrastructure/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../../../src/infrastructure/repository/db", () => ({
  userStatusChangeReasons: {
    findAll: jest.fn(),
  },
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
const correlationId = "correlation-id";

describe("userSequelizeAdapter.findUserStatusChangeReasons", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("should return null when no records are found is missing", async () => {
    const result = await findUserStatusChangeReasons(userId, correlationId);
    expect(result).toBeNull();
  });

  it("should return records if any are found", async () => {
    const expectedResult = [
      {
        id: "9699b551-06bd-4ad5-9a93-243651e88497",
        user_id: "da8a2b9a-3670-4823-b778-a78ae3403bb6",
        old_status: 0,
        new_status: 1,
        reason: "Test reason",
        createdAt: "2025-04-22 10:16:56.2130000",
        updatedAt: "2025-04-22 10:16:56.2130000",
      },
    ];

    db.userStatusChangeReasons.findAll.mockResolvedValue(expectedResult);
    const result = await findUserStatusChangeReasons(userId, correlationId);
    expect(result).toBe(expectedResult);
  });
});

const {
  updateEntraDeferUntilDate,
} = require("../../../../src/app/user/adapter/UserSequelizeAdapter");
const db = require("../../../../src/infrastructure/repository/db");
const logger = require("../../../../src/infrastructure/logger");

jest.mock("../../../../src/infrastructure/repository/db", () => ({
  user: {
    update: jest.fn(),
  },
}));

jest.mock("../../../../src/infrastructure/logger", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe("updateEntraDeferUntilDate function", () => {
  const uid = "mock-uid";
  const deferDate = new Date();
  const correlationId = "mock-correlation-id";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully update the 'entra_defer_until' field in the 'dbo.user' table", async () => {
    db.user.update.mockResolvedValue([1]);

    const result = await updateEntraDeferUntilDate(
      uid,
      deferDate,
      correlationId,
    );

    expect(db.user.update).toHaveBeenCalledWith(
      { entra_defer_until: deferDate },
      { where: { sub: uid } },
    );
    expect(result).toEqual([1]);
    expect(logger.info).toHaveBeenCalledWith(
      `Successfully updated [entra_defer_until] field for given UID: ${uid}`,
      { correlationId },
    );
  });

  it("should log and throw an error if no user is found in the 'dbo.user' table with the given UID", async () => {
    db.user.update.mockResolvedValue([0]);

    await expect(
      updateEntraDeferUntilDate(uid, deferDate, correlationId),
    ).rejects.toThrow(`No user found with the given UID: ${uid}`);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        `Error updating [entra_defer_until] field: No user found with the given UID: ${uid} (Correlation ID: ${correlationId}). Stack trace: `,
      ),
      { correlationId },
    );
  });

  it("should log and throw an error if update the 'entra_defer_until' field in the 'dbo.user' table fails", async () => {
    const error = new Error("Sequelize error");
    db.user.update.mockRejectedValue(error);

    await expect(
      updateEntraDeferUntilDate(uid, deferDate, correlationId),
    ).rejects.toThrow(error);

    expect(logger.error).toHaveBeenCalledWith(
      `Error updating [entra_defer_until] field: ${error.message} (Correlation ID: ${correlationId}). Stack trace: ${error.stack}`,
      { correlationId },
    );
  });
});

jest.mock("../../../../../src/infrastructure/logger", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

jest.mock(
  "../../../../../src/app/user/adapter/userSequelizeHelpers/findUserByEntraOidHelper",
);
jest.mock(
  "../../../../../src/app/user/adapter/userSequelizeHelpers/findUserByIdHelper",
);

jest.mock("../../../../../src/infrastructure/repository/db", () => ({
  user: {
    findOne: jest.fn(),
  },
}));

const db = require("../../../../../src/infrastructure/repository/db");
const linkUserWithEntraOid = require("../../../../../src/app/user/adapter/userSequelizeHelpers/linkDsiUserWithEntraHelper");
const findUserByEntraOidHelper = require("../../../../../src/app/user/adapter/userSequelizeHelpers/findUserByEntraOidHelper");
const findUserById = require("../../../../../src/app/user/adapter/userSequelizeHelpers/findUserByIdHelper");
const logger = require("../../../../../src/infrastructure/logger");

const fakeExistingUser = {
  given_name: "original-given-name",
  family_name: "original-family-name",
  is_entra: false,
  entra_oid: null,
  entra_linked: null,
};

const fakeExistingEntraUser = {
  sub: "fake-sub-is",
};

describe("linkUserWithEntraOid function", () => {
  const correlationId = "testCorrelationId";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null if a user is not found", async () => {
    db.user.findOne.mockResolvedValue();

    const result = await linkUserWithEntraOid(
      "uid",
      "entra-id",
      undefined,
      undefined,
      correlationId,
    );

    await expect(result).toBe(null);
  });

  it("should return null if a user already exists with the given entraOid", async () => {
    findUserById.mockResolvedValue(fakeExistingUser);

    findUserByEntraOidHelper.mockResolvedValue(fakeExistingEntraUser);

    const result = await linkUserWithEntraOid(
      "uid",
      "entra-id",
      undefined,
      undefined,
      correlationId,
    );

    await expect(result).toBe(null);
  });

  it("should create a new user entity with given_name changed", async () => {
    findUserById.mockResolvedValue({
      update: jest.fn().mockImplementation((updatedFields) => ({
        ...fakeExistingUser,
        ...updatedFields,
      })),
    });

    const entraOid = "78071717-4247-480d-90a3-3d531379ebf8";
    const userId = "98071717-4247-480d-90a3-3d531379ebf9";
    const firstName = "fake-first-name";

    findUserByEntraOidHelper.mockResolvedValue(null);

    const result = await linkUserWithEntraOid(
      userId,
      entraOid,
      firstName,
      undefined,
      correlationId,
    );

    await expect(result).toMatchObject({
      entra_oid: entraOid,
      family_name: fakeExistingUser.family_name,
      given_name: firstName,
      is_entra: true,
    });
  });

  it("should create a new user entity with family_name changed", async () => {
    findUserById.mockResolvedValue({
      update: jest.fn().mockImplementation((updatedFields) => ({
        ...fakeExistingUser,
        ...updatedFields,
      })),
    });

    const entraOid = "78071717-4247-480d-90a3-3d531379ebf8";
    const userId = "98071717-4247-480d-90a3-3d531379ebf9";
    const lastName = "fake-family-name";

    findUserByEntraOidHelper.mockResolvedValue(null);

    const result = await linkUserWithEntraOid(
      userId,
      entraOid,
      undefined,
      lastName,
      correlationId,
    );

    await expect(result).toMatchObject({
      entra_oid: entraOid,
      family_name: lastName,
      given_name: fakeExistingUser.given_name,
      is_entra: true,
    });
  });

  it("should handle the raising of an exception", async () => {
    findUserById.mockImplementation(() => {
      throw new Error();
    });

    await expect(
      linkUserWithEntraOid(
        "uid",
        "entra-id",
        undefined,
        undefined,
        correlationId,
      ),
    ).rejects.toThrow();
    expect(logger.error).toHaveBeenCalledWith(
      "linkUserWithEntra failed for request testCorrelationId error: Error",
      { correlationId },
    );
  });

  describe("when a concurrent request has already linked the entra oid", () => {
    const entraOid = "78071717-4247-480d-90a3-3d531379ebf8";
    const userId = "98071717-4247-480d-90a3-3d531379ebf9";
    const otherUserId = "aaaaaaaa-4247-480d-90a3-3d531379ebf8";

    // IMPORTANT: this deliberately does NOT set `err.fields` to a useful
    // shape, because that's what Sequelize's mssql dialect actually
    // produces for the unique INDEX (not a named `unique:` constraint on
    // the model) that the companion dsi-platform migration adds - see
    // node_modules/sequelize/lib/dialects/mssql/query.js `formatError`:
    // the "duplicate key row ... with unique index" message has only one
    // capture group (the index name), so `fields` is left as `{}`. The
    // recovery logic must not depend on `err.fields` at all.
    const realisticUniqueConstraintError = () => {
      const err = new Error(
        "Cannot insert duplicate key row in object 'dbo.user' with unique index 'IDX__user__entra_oid__unique'.",
      );
      err.name = "SequelizeUniqueConstraintError";
      err.fields = {};
      return err;
    };

    it("should return the winning user record when the update raises a realistic (fields-less) unique constraint violation for a self-race", async () => {
      const updateError = realisticUniqueConstraintError();
      // The mssql driver returns uniqueidentifier columns in UPPERCASE
      // (tedious defaults to bufferToUpperCaseGuid), while the uid param
      // arrives lowercase from the .NET caller (Guid.ToString("D")) - the
      // comparison in linkDsiUserWithEntraHelper.js must be case-insensitive
      // or this self-race match never fires in production.
      const winningUser = { sub: userId.toUpperCase(), entra_oid: entraOid };

      findUserById.mockResolvedValue({
        update: jest.fn().mockRejectedValue(updateError),
      });

      findUserByEntraOidHelper
        .mockResolvedValueOnce(null) // initial not-already-linked check
        .mockResolvedValueOnce(winningUser); // recovery re-query after race

      const result = await linkUserWithEntraOid(
        userId,
        entraOid,
        undefined,
        undefined,
        correlationId,
      );

      expect(findUserByEntraOidHelper).toHaveBeenNthCalledWith(
        2,
        entraOid,
        correlationId,
      );
      expect(result).toBe(winningUser);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should NOT return the winning row and should return null when it belongs to a different DSI user (real conflict, not a self-race)", async () => {
      const updateError = realisticUniqueConstraintError();
      const winningUser = { sub: otherUserId, entra_oid: entraOid };

      findUserById.mockResolvedValue({
        update: jest.fn().mockRejectedValue(updateError),
      });

      findUserByEntraOidHelper
        .mockResolvedValueOnce(null) // initial not-already-linked check
        .mockResolvedValueOnce(winningUser); // recovery re-query finds a DIFFERENT user

      const result = await linkUserWithEntraOid(
        userId,
        entraOid,
        undefined,
        undefined,
        correlationId,
      );

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        `Cannot link entra oid '${entraOid}' with DSI user '${userId}' because it has already been linked to a DSI user '${otherUserId}' (correlation id: ${correlationId})`,
        { correlationId },
      );
    });

    it("should log and rethrow the original error if the winning row cannot be found on re-query", async () => {
      const updateError = realisticUniqueConstraintError();

      findUserById.mockResolvedValue({
        update: jest.fn().mockRejectedValue(updateError),
      });

      findUserByEntraOidHelper
        .mockResolvedValueOnce(null) // initial not-already-linked check
        .mockResolvedValueOnce(null); // recovery re-query finds nothing

      await expect(
        linkUserWithEntraOid(
          userId,
          entraOid,
          undefined,
          undefined,
          correlationId,
        ),
      ).rejects.toBe(updateError);

      expect(logger.error).toHaveBeenCalledWith(
        `linkUserWithEntra failed for request ${correlationId} error: ${updateError}`,
        { correlationId },
      );
    });

    it("should log and rethrow when the update fails with a non unique-constraint error", async () => {
      const updateError = new Error("connection timeout");

      findUserById.mockResolvedValue({
        update: jest.fn().mockRejectedValue(updateError),
      });

      findUserByEntraOidHelper.mockResolvedValueOnce(null); // initial not-already-linked check

      await expect(
        linkUserWithEntraOid(
          userId,
          entraOid,
          undefined,
          undefined,
          correlationId,
        ),
      ).rejects.toBe(updateError);

      expect(findUserByEntraOidHelper).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        `linkUserWithEntra failed for request ${correlationId} error: ${updateError}`,
        { correlationId },
      );
    });

    it("should rethrow the ORIGINAL constraint error, and still log it, if the recovery re-query itself throws", async () => {
      const updateError = realisticUniqueConstraintError();
      const requeryError = new Error("transient db error during recovery");

      findUserById.mockResolvedValue({
        update: jest.fn().mockRejectedValue(updateError),
      });

      findUserByEntraOidHelper
        .mockResolvedValueOnce(null) // initial not-already-linked check
        .mockRejectedValueOnce(requeryError); // recovery re-query fails

      await expect(
        linkUserWithEntraOid(
          userId,
          entraOid,
          undefined,
          undefined,
          correlationId,
        ),
      ).rejects.toBe(updateError);

      expect(logger.error).toHaveBeenCalledWith(
        `linkUserWithEntra failed for request ${correlationId} error: ${updateError}`,
        { correlationId },
      );
    });
  });
});

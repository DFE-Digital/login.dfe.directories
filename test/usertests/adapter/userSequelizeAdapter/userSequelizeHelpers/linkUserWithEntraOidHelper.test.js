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

    const uniqueConstraintError = () => {
      const err = new Error("Validation error");
      err.name = "SequelizeUniqueConstraintError";
      err.fields = { entra_oid: entraOid };
      return err;
    };

    it("should return the winning user record when the update raises a unique constraint violation", async () => {
      const updateError = uniqueConstraintError();
      const winningUser = { sub: "winning-sub", entra_oid: entraOid };

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

    it("should log and rethrow the original error if the winning row cannot be found on re-query", async () => {
      const updateError = uniqueConstraintError();

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
  });
});

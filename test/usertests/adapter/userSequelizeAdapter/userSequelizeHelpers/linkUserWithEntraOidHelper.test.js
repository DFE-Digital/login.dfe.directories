jest.mock("../../../../../src/infrastructure/logger", () => ({
  error: jest.fn(),
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
      update: jest
        .fn()
        .mockImplementation((updatedFields) => ({
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
      update: jest
        .fn()
        .mockImplementation((updatedFields) => ({
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
});

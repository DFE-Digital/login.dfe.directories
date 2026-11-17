const { v4: uuid } = require("uuid");
const { Op, TableHints } = require("sequelize");
const {
  hashPassword,
  getLatestPolicyCode,
} = require("login.dfe.password-policy");

const {
  create,
} = require("../../../../src/app/user/adapter/UserSequelizeAdapter");
const {
  findByUsernameHelper,
} = require("../../../../src/app/user/adapter/userSequelizeHelpers/findByUsernameHelper");
const findUserByEntraOidHelper = require("../../../../src/app/user/adapter/userSequelizeHelpers/findUserByEntraOidHelper");
const generateSalt = require("../../../../src/app/user/utils/generateSalt");
const db = require("../../../../src/infrastructure/repository/db");

jest.mock(
  "../../../../src/app/user/adapter/userSequelizeHelpers/findByUsernameHelper",
  () => ({
    findByUsernameHelper: jest.fn(),
  }),
);
jest.mock(
  "../../../../src/app/user/adapter/userSequelizeHelpers/findUserByEntraOidHelper",
);
jest.mock("../../../../src/infrastructure/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../../../src/infrastructure/repository/db", () => ({
  user: {
    create: jest.fn().mockResolvedValue({ entra_linked: new Date() }),
    findOne: jest.fn(),
  },
  userPasswordPolicy: { create: jest.fn() },
  userLegacyUsername: { create: jest.fn() },
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
jest.mock("../../../../src/app/user/utils/generateSalt");
jest.mock("login.dfe.password-policy", () => ({
  getLatestPolicyCode: jest.fn(() => "v3"),
  hashPassword: jest.fn(),
}));

jest.mock("sequelize");

describe("userSequelizeAdapter.create", () => {
  beforeEach(() => {
    uuid.mockReturnValue("newId");
    generateSalt.mockReturnValue("salt");
    hashPassword.mockResolvedValue("hashedPassword");
    getLatestPolicyCode.mockReturnValue("v3");
    findByUsernameHelper.mockResolvedValue(null);
    findUserByEntraOidHelper.mockResolvedValue(null);
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("should return null if username is missing", async () => {
    const result = await create(
      null,
      "password",
      "John",
      "Doe",
      null,
      null,
      "correlationId",
      null,
    );
    expect(result).toBeNull();
  });

  it("should return null if username and password and entraOid are missing", async () => {
    const result = await create(
      null,
      null,
      "John",
      "Doe",
      "legacyUsername",
      "1234567890",
      "correlationId",
      null,
    );
    expect(result).toBeNull();
  });

  it("should return null if username is present but password and entrOid are missing", async () => {
    const result = await create(
      "john.doe@test.com",
      null,
      "John",
      "Doe",
      "legacyUsername",
      "1234567890",
      "correlationId",
      null,
    );
    expect(result).toBeNull();
  });

  it("should return null if username, password and entraOid are all present", async () => {
    const result = await create(
      "john.doe@test.com",
      "password",
      "John",
      "Doe",
      "legacyUsername",
      "1234567890",
      "correlationId",
      "entraOid",
    );
    expect(result).toBeNull();
  });

  it("should return the existing user record if already exists", async () => {
    const existingUserRecord = {
      given_name: "Test",
      family_name: "User",
    };
    findByUsernameHelper.mockResolvedValue(existingUserRecord);
    const result = await create(
      "john.doe@test.com",
      "password",
      "John",
      "Doe",
      null,
      null,
      "correlationId",
      undefined,
    );
    expect(result).toBe(existingUserRecord);
  });

  it("should create a new user with hashed password and entra `is_entra` flag set to `false` when `entraOid` is not provided", async () => {
    const newUser = {
      id: "newId",
      sub: "newId",
      given_name: "John",
      family_name: "Doe",
      email: "john.doe@test.com",
      salt: "salt",
      password: "hashedPassword",
      status: 1,
      phone_number: null,
      password_reset_required: false,
      is_entra: false,
      entra_oid: null,
      entra_linked: null,
      is_internal_user: false,
    };

    db.user.create.mockResolvedValue({ sub: "newId", entra_linked: null });

    const result = await create(
      "john.doe@test.com",
      "password",
      "John",
      "Doe",
      null,
      null,
      "correlationId",
      false,
      undefined,
    );
    expect(generateSalt).toHaveBeenCalled();
    expect(hashPassword).toHaveBeenCalled();
    expect(hashPassword).toHaveBeenCalledWith("v3", "password", "salt");
    expect(db.user.create).toHaveBeenCalled();
    expect(db.user.create).toHaveBeenCalledWith(newUser);

    expect(result).toEqual({ ...newUser, id: "newId", entra_linked: null });
  });

  it("should create a new user with hashed password and entra `is_entra` flag set to `true` and password `none` when `entraOid` is provided", async () => {
    const newUser = {
      id: "newId",
      sub: "newId",
      given_name: "John",
      family_name: "Doe",
      email: "john.doe@test.com",
      salt: "salt",
      password: "none",
      status: 1,
      phone_number: null,
      password_reset_required: false,
      is_entra: true,
      is_internal_user: false,
      entra_oid: "entraId",
      entra_linked: new Date("2024-08-02T09:56:39.890Z"),
    };

    db.user.create.mockResolvedValue(newUser);

    const result = await create(
      "john.doe@test.com",
      undefined,
      "John",
      "Doe",
      undefined,
      null,
      "correlationId",
      "entraId",
    );

    expect(generateSalt).toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
    expect(db.user.create).toHaveBeenCalled();
    expect(db.user.create).toHaveBeenCalledWith(newUser);
    expect(db.userPasswordPolicy.create).toHaveBeenCalled();

    expect(result).toEqual({
      ...newUser,
      id: "newId",
      entra_linked: new Date("2024-08-02T09:56:39.890Z"),
    });
  });

  it("should create a ne entry into the `user_legacy_username` table if legacy username is provided", async () => {
    await create(
      "john.doe@test.com",
      "password",
      "John",
      "Doe",
      "johnDoeLegacyUsername",
      null,
      "correlationId",
      undefined,
    );

    expect(db.userLegacyUsername.create).toHaveBeenCalledWith({
      legacy_username: "johnDoeLegacyUsername",
      uid: "newId",
    });
  });

  describe("when a concurrent registration causes a unique constraint violation", () => {
    // IMPORTANT: this deliberately does NOT set `err.fields` to anything
    // useful, because that's what Sequelize's mssql dialect actually
    // produces for the unique INDEX (not a named `unique:` constraint on
    // the model) that the companion dsi-platform migration adds - see
    // node_modules/sequelize/lib/dialects/mssql/query.js `formatError`:
    // the "duplicate key row ... with unique index" message has only one
    // capture group (the index name), so `match[3]` is undefined and
    // `fields` is left as `{}`. The recovery logic must not depend on
    // `err.fields` at all - it re-queries using the values this request
    // was itself trying to create.
    const realisticUniqueConstraintError = () => {
      const err = new Error(
        "Cannot insert duplicate key row in object 'dbo.user' with unique index 'IDX__user__email__unique'.",
      );
      err.name = "SequelizeUniqueConstraintError";
      err.fields = {};
      return err;
    };

    it("should return the winning user record when entraOid is provided and a single row matches both email and entra_oid", async () => {
      const winningUser = {
        sub: "winning-id",
        email: "john.doe@test.com",
        entra_oid: "entraId",
      };

      db.user.create.mockRejectedValueOnce(realisticUniqueConstraintError());
      db.user.findOne.mockResolvedValueOnce(winningUser); // recovery re-query

      const result = await create(
        "john.doe@test.com",
        undefined,
        "John",
        "Doe",
        null,
        null,
        "correlationId",
        "entraId",
      );

      // The recovery query must require BOTH email and entra_oid to match on
      // the same row - a row matching only one of the two is a genuine
      // conflict (e.g. this email already belongs to a different Entra
      // identity), not a self-race, and must not be silently returned.
      expect(db.user.findOne).toHaveBeenCalledWith({
        tableHint: TableHints.NOLOCK,
        where: {
          email: { [Op.eq]: "john.doe@test.com" },
          entra_oid: { [Op.eq]: "entraId" },
        },
      });
      expect(findByUsernameHelper).toHaveBeenCalledTimes(1); // initial existence check only
      expect(findUserByEntraOidHelper).not.toHaveBeenCalled();
      expect(result).toBe(winningUser);
      expect(db.userPasswordPolicy.create).not.toHaveBeenCalled();
      expect(db.userLegacyUsername.create).not.toHaveBeenCalled();
    });

    it("should return the winning user record found by email alone when no entraOid was provided (classic password-based create)", async () => {
      const winningUser = { sub: "winning-id", email: "john.doe@test.com" };

      db.user.create.mockRejectedValueOnce(realisticUniqueConstraintError());
      db.user.findOne.mockResolvedValueOnce(winningUser); // recovery re-query

      const result = await create(
        "john.doe@test.com",
        "password",
        "John",
        "Doe",
        null,
        null,
        "correlationId",
        undefined,
      );

      expect(db.user.findOne).toHaveBeenCalledWith({
        tableHint: TableHints.NOLOCK,
        where: { email: { [Op.eq]: "john.doe@test.com" } },
      });
      expect(result).toBe(winningUser);
      expect(db.userPasswordPolicy.create).not.toHaveBeenCalled();
      expect(db.userLegacyUsername.create).not.toHaveBeenCalled();
    });

    it("should rethrow the original error if the combined re-query finds no matching row", async () => {
      const err = realisticUniqueConstraintError();
      db.user.create.mockRejectedValueOnce(err);
      db.user.findOne.mockResolvedValueOnce(null); // recovery re-query finds nothing

      await expect(
        create(
          "john.doe@test.com",
          undefined,
          "John",
          "Doe",
          null,
          null,
          "correlationId",
          "entraId",
        ),
      ).rejects.toBe(err);

      expect(db.userPasswordPolicy.create).not.toHaveBeenCalled();
    });

    it("should rethrow errors that are not unique constraint violations, without attempting any recovery re-query", async () => {
      const err = new Error("connection timeout");
      db.user.create.mockRejectedValueOnce(err);

      await expect(
        create(
          "john.doe@test.com",
          "password",
          "John",
          "Doe",
          null,
          null,
          "correlationId",
          undefined,
        ),
      ).rejects.toBe(err);

      expect(findByUsernameHelper).toHaveBeenCalledTimes(1);
      expect(db.user.findOne).not.toHaveBeenCalled();
      expect(findUserByEntraOidHelper).not.toHaveBeenCalled();
      expect(db.userPasswordPolicy.create).not.toHaveBeenCalled();
    });

    it("should rethrow the ORIGINAL constraint error, not a recovery re-query failure, if the re-query itself throws", async () => {
      const originalError = realisticUniqueConstraintError();
      const requeryError = new Error("transient db error during recovery");

      db.user.create.mockRejectedValueOnce(originalError);
      db.user.findOne.mockRejectedValueOnce(requeryError); // recovery re-query fails

      await expect(
        create(
          "john.doe@test.com",
          "password",
          "John",
          "Doe",
          null,
          null,
          "correlationId",
          undefined,
        ),
      ).rejects.toBe(originalError);

      expect(db.userPasswordPolicy.create).not.toHaveBeenCalled();
    });
  });
});

jest.mock("login.dfe.request-verification");
jest.mock("./../../src/infrastructure/config", () => ({
  adapter: {
    params: {
      redisurl: "http://orgs.api.test",
    },
  },
}));
jest.mock("activedirectory", () => {
  const user = {
    dn: "test",
    givenName: "Test",
    sn: "Tester",
    userPrincipalName: "test@localuser.com",
  };
  const findUserStub = jest
    .fn()
    .mockImplementation((options, userName, callback) => {
      callback(null, user);
    });
  const authenticateStub = jest
    .fn()
    .mockImplementation((userName, password, callback) => {
      callback(null, true);
    });
  return jest.fn().mockImplementation(() => ({
    findUser: findUserStub,
    findByUsername: findUserStub,
    authenticate: authenticateStub,
  }));
});

const activeDirectory = require("activedirectory");

describe("When using the UserAzureActiveDirectoryAdapter", () => {
  const user = {
    dn: "test",
    givenName: "Test",
    sn: "Tester",
    userPrincipalName: "test@localuser.com",
  };

  describe("and finding user by email", () => {
    it("the user is read from active directory", async () => {
      const expectedUserName = "test";

      const adapter = require("./../../src/app/user/adapter/UserAzureActiveDirectoryAdapter");
      const actual = await adapter.find(expectedUserName);

      expect(activeDirectory().findUser.mock.calls).toHaveLength(1);
      expect(activeDirectory().findUser.mock.calls[0][1]).toBe(
        expectedUserName,
      );
      expect(actual).not.toBeNull();
      expect(actual.sub).toEqual(user.dn);
      expect(actual.given_name).toEqual(user.givenName);
      expect(actual.family_name).toEqual(user.sn);
      expect(actual.email).toEqual(user.userPrincipalName);
    });
  });
  describe("and authenticating", () => {
    it("then the username and password are checked against the active directory", async () => {
      const expectedUserName = "test";
      const expectedPassword = "p@ssw0rd";

      const adapter = require("./../../src/app/user/adapter/UserAzureActiveDirectoryAdapter");
      const actual = await adapter.authenticate(
        expectedUserName,
        expectedPassword,
      );

      expect(activeDirectory().authenticate.mock.calls).toHaveLength(1);
      expect(activeDirectory().authenticate.mock.calls[0][0]).toBe(
        expectedUserName,
      );
      expect(activeDirectory().authenticate.mock.calls[0][1]).toBe(
        expectedPassword,
      );
      expect(actual).not.toBeNull();
      expect(actual.sub).toBe(user.dn);
      expect(actual.given_name).toBe(user.givenName);
      expect(actual.family_name).toBe(user.sn);
      expect(actual.email).toBe(user.userPrincipalName);
    });
  });
});

jest.mock("login.dfe.jobs-client");
jest.mock("./../../src/app/user/adapter", () => ({
  findByUsername: jest.fn(),
  create: jest.fn(),
  findByEntraOid: jest.fn(),
}));

jest.mock("./../../src/infrastructure/logger", () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
  };
});

jest.mock("./../../src/infrastructure/config", () => {
  return {
    notifications: {
      connectionString: "notifications-connection-string",
      genericEmailStrings: ["head", "ht", "admin"],
      supportTeamEmail: "support@example.com",
    },
    toggles: {
      notificationsEnabled: true,
    },
  };
});

const {
  ServiceNotificationsClient,
  NotificationClient,
} = require("login.dfe.jobs-client");
const {
  findByUsername,
  create,
  findByEntraOid,
} = require("../../src/app/user/adapter");
const createUser = require("../../src/app/user/api/createUser");
const httpMocks = require("node-mocks-http");
const logger = require("../../src/infrastructure/logger");

const newUser = {
  sub: "some-new-id",
  password: "somepassword",
  status: 1,
};

const serviceNotificationsClient = {
  notifyUserUpdated: jest.fn(),
};

const notificationClient = {
  sendSupportRequest: jest.fn(),
};

describe("When creating a user", () => {
  let req;
  let res;
  const expectedRequestCorrelationId = "some-correlation-id";

  beforeEach(() => {
    req = {
      params: {
        id: "a516696c-168c-4680-8dfb-1512d6fc234c",
      },
      body: {
        email: "test@local",
        password: "password-test",
        firstName: "Test",
        lastName: "Tester",
        phone_number: "07700 900000",
      },
      headers: {
        "x-correlation-id": expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    res = httpMocks.createResponse();

    findByUsername.mockReset().mockReturnValue(null);
    create.mockReset().mockReturnValue(newUser);

    serviceNotificationsClient.notifyUserUpdated.mockReset();
    ServiceNotificationsClient.mockReset().mockImplementation(
      () => serviceNotificationsClient,
    );
    notificationClient.sendSupportRequest.mockReset();
    NotificationClient.mockReset().mockImplementation(() => notificationClient);
  });

  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });

  it("then if the params are missing a bad request is returned", async () => {
    req.body.email = "";

    await createUser(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("then if a user already exists with that user a conflict error is returned", async () => {
    findByUsername.mockReturnValue({ email: "some@local" });

    await createUser(req, res);

    expect(findByUsername.mock.calls).toHaveLength(1);
    expect(findByUsername.mock.calls[0][0]).toBe(req.body.email);
    expect(findByUsername.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
    expect(res.statusCode).toBe(409);
  });

  it("then if the request is valid then the call is made to the repository to create the user", async () => {
    await createUser(req, res);

    expect(create.mock.calls).toHaveLength(1);
    expect(create.mock.calls[0][0]).toBe(req.body.email);
    expect(create.mock.calls[0][1]).toBe(req.body.password);
    expect(create.mock.calls[0][2]).toBe(req.body.firstName);
    expect(create.mock.calls[0][3]).toBe(req.body.lastName);
    expect(create.mock.calls[0][5]).toBe(req.body.phone_number);
    expect(create.mock.calls[0][6]).toBe(expectedRequestCorrelationId);
  });

  it("then if the legacy_username is provided in the body it is passed to the repository", async () => {
    req.body.legacy_username = "123asd";

    await createUser(req, res);

    expect(create.mock.calls).toHaveLength(1);
    expect(create.mock.calls[0][4]).toBe(req.body.legacy_username);
  });

  it("then the user is returned in the response", async () => {
    await createUser(req, res);

    expect(res._getData().sub).toBe("some-new-id");
    expect(res._getData().password).toBe(undefined);
  });

  it("then a user updated notification is sent", async () => {
    await createUser(req, res);

    expect(ServiceNotificationsClient).toHaveBeenCalledTimes(1);
    expect(ServiceNotificationsClient).toHaveBeenCalledWith({
      connectionString: "notifications-connection-string",
    });
    expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledTimes(
      1,
    );
    expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledWith(
      Object.assign({}, newUser, {
        status: newUser.status,
        password: undefined,
      }),
    );
  });

  it("should return 400 if no firstName is provided", async () => {
    req.body.firstName = null;

    await createUser(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("should return 400 if no lastName is provided", async () => {
    req.body.lastName = null;

    await createUser(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("should return 400 if the request contains both password and entraOid", async () => {
    req.body.entraOid = "01913788-ab6a-705e-b861-de8a60edfdb8";

    await createUser(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("should return 400 if no password or entraOid is provided", async () => {
    req.body.entraOid = null;
    req.body.password = null;

    await createUser(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("should return 409 if an existing user has been assigned the entraOid", async () => {
    req.body.password = null;
    req.body.entraOid = "01913788-ab6a-705e-b861-de8a60edfdb8";

    findByEntraOid.mockReturnValue({
      sub: "8b6141a6-294c-4bde-ba9b-2e6e68c87af8",
      entra_oid: "01913788-ab6a-705e-b861-de8a60edfdb8",
    });

    await createUser(req, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.statusCode).toBe(409);
  });

  it("should return 500 in the event of an exception being thrown", async () => {
    req.body.password = null;
    req.body.entraOid = "01913788-ab6a-705e-b861-de8a60edfdb8";

    findByEntraOid.mockImplementation(() => {
      throw new Error();
    });

    await createUser(req, res);

    expect(res.statusCode).toBe(500);
  });

  it("should create a user assigned to entraOid", async () => {
    req.body.password = null;
    req.body.entraOid = "d0c342aa-549f-4992-ae00-e8fdc47592a9";

    findByEntraOid.mockReturnValue(undefined);

    await createUser(req, res);

    expect(create.mock.calls).toHaveLength(1);
    expect(create.mock.calls[0]).toEqual([
      req.body.email,
      null,
      req.body.firstName,
      req.body.lastName,
      undefined,
      req.body.phone_number,
      expectedRequestCorrelationId,
      "d0c342aa-549f-4992-ae00-e8fdc47592a9",
    ]);
  });

  it.each([
    "testhead@example.com",
    "TESTHEAD@example.com",
    "tEsThEaD@example.com",
    "testdraught@example.com",
    "TESTDRAUGHT@example.com",
    "tEsTdRaUgHt@example.com",
    "testadmin@example.com",
    "TESTADMIN@example.com",
    "tEsTaDmIn@example.com",
  ])(
    "should send a support request if the user's email address username contains any of the generic email strings (case-insensitive): %s",
    async (email) => {
      const firstName = "TestFirst";
      const lastName = "TestLast";
      req.body.email = email;
      req.body.firstName = firstName;
      req.body.lastName = lastName;

      await createUser(req, res);

      expect(NotificationClient).toHaveBeenCalledTimes(1);
      expect(NotificationClient).toHaveBeenCalledWith({
        connectionString: "notifications-connection-string",
      });
      expect(logger.info).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        "User with id [some-new-id] has a potentially generic email address. Creating a support request to review it.",
        { correlationId: expectedRequestCorrelationId },
      );
      expect(notificationClient.sendSupportRequest).toHaveBeenCalledTimes(1);
      expect(notificationClient.sendSupportRequest).toHaveBeenCalledWith(
        "",
        "support@example.com",
        undefined,
        "potential-generic-email-address",
        undefined,
        undefined,
        undefined,
        `New user has a potentially generic email address, please review the user: ${email} (${firstName} ${lastName}).`,
      );
    },
  );

  it("should not send a support request if the user's email address domain contains any of the generic email strings", async () => {
    req.body.email = "john.doe@example-head.com";

    await createUser(req, res);

    expect(notificationClient.sendSupportRequest).not.toHaveBeenCalled();
  });

  it("should not send a support request if the user's email address username doesn't contain any of the generic email strings", async () => {
    req.body.email = "john.doe@example.com";

    await createUser(req, res);

    expect(notificationClient.sendSupportRequest).not.toHaveBeenCalled();
  });
});

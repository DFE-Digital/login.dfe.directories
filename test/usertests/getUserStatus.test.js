jest.mock("login.dfe.jobs-client");
const httpMocks = require("node-mocks-http");
const getUserStatus = require("../../src/app/user/api/getUserStatus");
const activateUser = require("../../src/app/user/api/activateUser");
const deactivateUser = require("../../src/app/user/api/deactivateUser");

jest.mock("../../src/infrastructure/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock("./../../src/app/user/adapter", () => {
  const findUserStatusChangeReasons = jest
    .fn()
    .mockImplementation(() => undefined);
  const find = jest.fn().mockImplementation(() => undefined);
  const changeStatus = jest.fn().mockImplementation(() => undefined);
  const createUserStatusChangeReason = jest
    .fn()
    .mockImplementation(() => undefined);
  return {
    find: jest.fn().mockImplementation(find),
    changeStatus: jest.fn().mockImplementation(changeStatus),
    createUserStatusChangeReason: jest
      .fn()
      .mockImplementation(createUserStatusChangeReason),
    findUserStatusChangeReasons: jest
      .fn()
      .mockImplementation(findUserStatusChangeReasons),
  };
});

jest.mock("./../../src/infrastructure/config", () => ({
  notifications: {
    connectionString: "notifications-connection-string",
  },
}));

const adapter = require("../../src/app/user/adapter");
const { ServiceNotificationsClient } = require("login.dfe.jobs-client");
const logger = require("../../src/infrastructure/logger");

const serviceNotificationsClient = {
  notifyUserUpdated: jest.fn(),
};

const user = {
  sub: "78071717-4247-480d-90a3-3d531379ebf8",
  email: "bob@bob.com",
  status: 0,
};

const findUserStatusChangeReasons = [
  {
    id: 1,
    user_id: "78071717-4247-480d-90a3-3d531379ebf8",
    old_status: 1,
    new_status: 0,
    reason: "Deactivation reason",
  },
];

describe("When calling the getStatus endpoint", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        id: undefined,
      },
      header: jest.fn().mockReturnValue("correlation-id"),
    };
    res = httpMocks.createResponse();
  });

  it("should return a 400 if the id parameter is missing", async () => {
    await getUserStatus(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("should return a 400 if the id parameter is present but not a Uuid", async () => {
    req.params.id = "1234";

    await getUserStatus(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("should return a 404 if id is a valid uuid but a user was not found", async () => {
    req.params.id = "78071717-4247-480d-90a3-3d531379ebf8";

    await getUserStatus(req, res);

    expect(res.statusCode).toBe(404);
  });

  it("should return a 200 if id is present and a user was found", async () => {
    req.params.id = "78071717-4247-480d-90a3-3d531379ebf8";

    adapter.find.mockReturnValue(user);
    adapter.findUserStatusChangeReasons.mockReturnValue(
      findUserStatusChangeReasons,
    );

    const expectedResult = {
      id: "78071717-4247-480d-90a3-3d531379ebf8",
      status: 0,
      statusChangeReasons: [
        {
          id: 1,
          user_id: "78071717-4247-480d-90a3-3d531379ebf8",
          old_status: 1,
          new_status: 0,
          reason: "Deactivation reason",
        },
      ],
    };

    await getUserStatus(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getData()).toMatchObject(expectedResult);
  });

  it("should return a 200 if id is present and a user was found but there are no status change reasons", async () => {
    req.params.id = "78071717-4247-480d-90a3-3d531379ebf8";

    adapter.find.mockReturnValue(user);
    adapter.findUserStatusChangeReasons.mockReturnValue(undefined);

    const expectedResult = {
      id: "78071717-4247-480d-90a3-3d531379ebf8",
      status: 0,
      statusChangeReasons: [],
    };

    await getUserStatus(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getData()).toMatchObject(expectedResult);
  });

  it("should return a 500 in the event of an exception", async () => {
    req.params.id = "78071717-4247-480d-90a3-3d531379ebf8";

    adapter.find.mockImplementation(() => {
      throw new Error("User not found");
    });

    await getUserStatus(req, res);

    expect(res.statusCode).toBe(500);
  });
});

describe("When activating a user", () => {
  let req;
  let res;
  const expectedRequestCorrelationId = "some-correlation-id";

  beforeEach(() => {
    req = {
      header: () => expectedRequestCorrelationId,
      params: {
        id: "a516696c-168c-4680-8dfb-1512d6fc234c",
      },
    };
    res = httpMocks.createResponse();

    adapter.changeStatus.mockReset();
    adapter.changeStatus.mockResolvedValue({
      id: "a516696c-168c-4680-8dfb-1512d6fc234c",
      sub: "a516696c-168c-4680-8dfb-1512d6fc234c",
      given_name: "Test",
      family_name: "Tester",
      email: "test@local",
      job_title: "Manager",
      status: 1,
    });

    serviceNotificationsClient.notifyUserUpdated.mockReset();
    serviceNotificationsClient.notifyUserUpdated.mockResolvedValue("job-id");
    ServiceNotificationsClient.mockReset().mockImplementation(
      () => serviceNotificationsClient,
    );

    logger.error.mockReset();
  });

  it("then it notifies when the user is updated", async () => {
    await activateUser(req, res);

    expect(adapter.changeStatus).toHaveBeenCalledWith(
      "a516696c-168c-4680-8dfb-1512d6fc234c",
      1,
      expectedRequestCorrelationId,
    );
    expect(ServiceNotificationsClient).toHaveBeenCalledWith({
      connectionString: "notifications-connection-string",
    });
    expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledWith({
      id: "a516696c-168c-4680-8dfb-1512d6fc234c",
      sub: "a516696c-168c-4680-8dfb-1512d6fc234c",
      given_name: "Test",
      family_name: "Tester",
      email: "test@local",
      job_title: "Manager",
      status: 1,
    });
  });

  it("then it returns 500 if notification fails", async () => {
    const expectedError = new Error("notification failed");
    serviceNotificationsClient.notifyUserUpdated.mockRejectedValue(
      expectedError,
    );

    await activateUser(req, res);

    expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledTimes(
      1,
    );
    expect(logger.error).toHaveBeenCalledWith(expectedError);
    expect(res.statusCode).toBe(500);
  });
});

describe("When deactivating a user", () => {
  let req;
  let res;
  const expectedRequestCorrelationId = "some-correlation-id";

  beforeEach(() => {
    req = {
      header: () => expectedRequestCorrelationId,
      params: {
        id: "a516696c-168c-4680-8dfb-1512d6fc234c",
      },
      body: {
        reason: "Deactivation reason",
      },
    };
    res = httpMocks.createResponse();

    adapter.changeStatus.mockReset();
    adapter.changeStatus.mockResolvedValue({
      id: "a516696c-168c-4680-8dfb-1512d6fc234c",
      sub: "a516696c-168c-4680-8dfb-1512d6fc234c",
      given_name: "Test",
      family_name: "Tester",
      email: "test@local",
      job_title: "Manager",
      status: 0,
    });
    adapter.createUserStatusChangeReason.mockReset();
    adapter.createUserStatusChangeReason.mockResolvedValue(undefined);

    serviceNotificationsClient.notifyUserUpdated.mockReset();
    serviceNotificationsClient.notifyUserUpdated.mockResolvedValue("job-id");
    ServiceNotificationsClient.mockReset().mockImplementation(
      () => serviceNotificationsClient,
    );

    logger.error.mockReset();
  });

  it("then it notifies when the user is updated", async () => {
    await deactivateUser(req, res);

    expect(adapter.changeStatus).toHaveBeenCalledWith(
      "a516696c-168c-4680-8dfb-1512d6fc234c",
      0,
      expectedRequestCorrelationId,
    );
    expect(adapter.createUserStatusChangeReason).toHaveBeenCalledWith(
      "a516696c-168c-4680-8dfb-1512d6fc234c",
      1,
      0,
      "Deactivation reason",
      expectedRequestCorrelationId,
    );
    expect(ServiceNotificationsClient).toHaveBeenCalledWith({
      connectionString: "notifications-connection-string",
    });
    expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledWith({
      id: "a516696c-168c-4680-8dfb-1512d6fc234c",
      sub: "a516696c-168c-4680-8dfb-1512d6fc234c",
      given_name: "Test",
      family_name: "Tester",
      email: "test@local",
      job_title: "Manager",
      status: 0,
    });
  });

  it("then it returns 500 if notification fails", async () => {
    const expectedError = new Error("notification failed");
    serviceNotificationsClient.notifyUserUpdated.mockRejectedValue(
      expectedError,
    );

    await deactivateUser(req, res);

    expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledTimes(
      1,
    );
    expect(logger.error).toHaveBeenCalledWith(expectedError);
    expect(res.statusCode).toBe(500);
  });
});

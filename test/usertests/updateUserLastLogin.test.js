const httpMocks = require("node-mocks-http");
const userAdapter = require("../../src/app/user/adapter");
const logger = require("../../src/infrastructure/logger");
const updateUserLastLogin = require("../../src/app/user/api/updateUserLastLogin");

jest.mock("./../../src/app/user/adapter", () => ({
  updateLastLogin: jest.fn(),
}));

jest.mock("./../../src/infrastructure/logger", () => ({
  error: jest.fn(),
}));

describe("When updating a users lastLogin request", () => {
  let req;
  let res;

  beforeEach(() => {
    userAdapter.updateLastLogin.mockReset();

    req = {
      header: () => "mock-correlation-id",
      params: {
        uid: "mock-user-uid",
      },
    };
    res = httpMocks.createResponse();
  });

  it("should call updateLastLogin with the correct parameters", async () => {
    await updateUserLastLogin(req, res);

    expect(userAdapter.updateLastLogin).toHaveBeenCalledWith(
      "mock-user-uid",
      "mock-correlation-id",
    );
  });

  it("should call return a 200 when called successfully", async () => {
    await updateUserLastLogin(req, res);

    expect(res.statusCode).toBe(200);
  });

  it("should call return a 500 when an error occurs", async () => {
    userAdapter.updateLastLogin.mockReset();
    userAdapter.updateLastLogin.mockImplementation(() => {
      throw new Error("mock-error");
    });

    await updateUserLastLogin(req, res);

    expect(res.statusCode).toBe(500);
  });

  it("should log an error when an error occurs", async () => {
    userAdapter.updateLastLogin.mockReset();
    userAdapter.updateLastLogin.mockImplementation(() => {
      throw new Error("mock-error");
    });

    await updateUserLastLogin(req, res);

    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});

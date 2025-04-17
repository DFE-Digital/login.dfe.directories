const httpMocks = require("node-mocks-http");
const getUserStatus = require("../../src/app/user/api/getUserStatus");

jest.mock("../../src/infrastructure/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock("./../../src/app/user/adapter", () => {
  const findUserStatusChangeReasons = jest
    .fn()
    .mockImplementation(() => undefined);
  const find = jest.fn().mockImplementation(() => undefined);
  return {
    find: jest.fn().mockImplementation(find),
    findUserStatusChangeReasons: jest
      .fn()
      .mockImplementation(findUserStatusChangeReasons),
  };
});

const adapter = require("../../src/app/user/adapter");
const user = {
  id: "78071717-4247-480d-90a3-3d531379ebf8",
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

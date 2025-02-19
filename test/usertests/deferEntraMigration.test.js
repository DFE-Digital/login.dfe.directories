const httpMocks = require("node-mocks-http");
const userAdapter = require("../../src/app/user/adapter");
const { isUuid, isValidDate } = require("../../src/app/user/api/helpers");
const deferEntraMigration = require("../../src/app/user/api/deferEntraMigration");

jest.mock("./../../src/app/user/adapter", () => ({
  updateEntraDeferUntilDate: jest.fn(),
}));

jest.mock("../../src/app/user/api/helpers", () => ({
  isUuid: jest.fn(),
  isValidDate: jest.fn(),
}));

describe("deferEntraMigration function", () => {
  let req;
  let res;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);

  beforeEach(() => {
    userAdapter.updateEntraDeferUntilDate.mockReset();
    isUuid.mockReset().mockReturnValue(true);
    isValidDate.mockReset().mockReturnValue(true);

    req = {
      header: () => "mock-correlation-id",
      params: {
        uid: "mock-user-uid",
      },
      body: {
        deferExpiryDate: futureDate,
      },
    };
    res = httpMocks.createResponse();
  });

  it("should return 400 if uid in request params is not a valid UUID", async () => {
    isUuid.mockReturnValue(false);

    await deferEntraMigration(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toBe("The uid provided is not a valid UUID.");
  });

  it("should return 400 if 'deferExpiryDate' is not a valid date", async () => {
    isValidDate.mockReset().mockReturnValue(false);

    await deferEntraMigration(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toBe(
      "Invalid date format: Expected ISO 8601 ('YYYY-MM-DDTHH:mm:ss.sssZ').",
    );
  });

  it("should return 400 if 'deferExpiryDate' is not a future date", async () => {
    req.body.deferExpiryDate = "2025-02-17T16:10:10.000Z";
    await deferEntraMigration(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toBe(
      "Invalid date: the 'deferExpiryDate' must be a future date.",
    );
  });

  it("should call 'updateEntraDeferUntilDate' function with correct parameters", async () => {
    await deferEntraMigration(req, res);

    expect(userAdapter.updateEntraDeferUntilDate).toHaveBeenCalledWith(
      "mock-user-uid",
      futureDate,
      "mock-correlation-id",
    );
  });

  it("should return 200 if the requests is successful", async () => {
    userAdapter.updateEntraDeferUntilDate.mockResolvedValue();

    await deferEntraMigration(req, res);

    expect(res.statusCode).toBe(200);
  });

  it("should return 500 if an error occurs", async () => {
    userAdapter.updateEntraDeferUntilDate.mockImplementation(() => {
      throw new Error("Sequelize error");
    });

    await deferEntraMigration(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getData()).toBe("Sequelize error");
  });
});

jest.mock("./../../src/app/userCodes/data/redisUserCodeStorage", () => {
  const getUserCodeStub = jest
    .fn()
    .mockReturnValue({
      uid: "7654321",
      code: "ABC123",
      redirectUri: "http://local.test",
    });
  return {
    getUserCode: jest.fn().mockImplementation(getUserCodeStub),
  };
});
jest.mock("./../../src/infrastructure/config", () => ({
  userCodes: {
    type: "redis",
    params: {
      redisUrl: "http://orgs.api.test",
    },
  },
}));
jest.mock("./../../src/infrastructure/logger", () => {
  return {};
});
const validate = require("./../../src/app/userCodes/api/validate");
const httpMocks = require("node-mocks-http");
const redisStorage = require("./../../src/app/userCodes/data/redisUserCodeStorage");

describe("When validating a user code", () => {
  let req;
  let res;
  const expectedRequestCorrelationId = "c2602b75-ba3f-4d56-af67-417099a7c6ca";

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      params: {
        uid: "7654321",
        code: "ABC123",
      },
      headers: {
        "x-correlation-id": expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };
  });
  it("then an empty response is returned and a bad request status code sent if there is no uid", async () => {
    const uidValues = ["", undefined, null];

    await Promise.all(
      await uidValues.map(async (valueToUse) => {
        req.params.uid = valueToUse;

        await validate(req, res);
        expect(res.statusCode).toBe(400);
      }),
    );
  });
  it("then an empty response is returned and a bad request status code sent if there is no code", async () => {
    const uidValues = ["", undefined, null];

    await Promise.all(
      await uidValues.map(async (valueToUse) => {
        req.params.code = valueToUse;

        await validate(req, res);
        expect(res.statusCode).toBe(400);
      }),
    );
  });
  it("then if a code exists for the uid and the code matches a successful response is returned", async () => {
    redisStorage.getUserCode.mockReturnValue({
      uid: "7654321",
      code: "ABC123",
    });

    await validate(req, res);

    expect(res._getData().code).toBe("ABC123");
    expect(res._getData().uid).toBe("7654321");
  });
  it("then if the code does not match then a 404 response is returned", async () => {
    redisStorage.getUserCode.mockReturnValue({
      uid: "7654321",
      code: "ZXY789",
    });

    await validate(req, res);

    expect(res.statusCode).toBe(404);
  });
  it("then the code is not matched against case", async () => {
    redisStorage.getUserCode.mockReturnValue({
      uid: "7654321",
      code: "ABC123",
    });
    req.params.code = "abc123";

    await validate(req, res);

    expect(res._getData().code).toBe("ABC123");
    expect(res._getData().uid).toBe("7654321");
  });
  it("then the parameters are passed to the storage provider", async () => {
    await validate(req, res);

    expect(redisStorage.getUserCode.mock.calls[0][0]).toBe("7654321");
    expect(redisStorage.getUserCode.mock.calls[0][1]).toBe("PasswordReset");
    expect(redisStorage.getUserCode.mock.calls[0][2]).toBe(
      expectedRequestCorrelationId,
    );
  });
});

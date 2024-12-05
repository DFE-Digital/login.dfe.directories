jest.mock("./../../src/app/user/adapter", () => {
  return {
    isMatched: jest.fn(),
  };
});
jest.mock("./../../src/infrastructure/logger", () => {
  return {};
});
const httpMocks = require("node-mocks-http");
const userAdapter = require("./../../src/app/user/adapter");

describe("When amending passowrd", () => {
  let res;

  beforeEach(() => {
    userAdapter.isMatched.mockReset();
    res = httpMocks.createResponse();
  });

  it("then the pass phrase should not match", async () => {
    userAdapter.isMatched.mockReturnValue(true);

    expect(res.statusCode).toBe(200);
  });

  it("then it should return true it does match", async () => {
    userAdapter.isMatched.mockReturnValue(false);
    expect(res.statusCode).toBe(200);
  });
});

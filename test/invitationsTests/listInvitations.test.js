"use strict";

jest.mock("./../../src/infrastructure/logger", () => {
  return {};
});
jest.mock("login.dfe.jobs-client");
jest.mock("./../../src/infrastructure/config", () => ({
  redis: {
    url: "http://orgs.api.test",
  },
}));
jest.mock("./../../src/app/invitations/data", () => {
  return {
    list: jest.fn(),
  };
});

const { list } = require("./../../src/app/invitations/data");
const httpMocks = require("node-mocks-http");
const listInvitations = require("./../../src/app/invitations/api/listInvitations");

describe("when listing invitations", () => {
  let req;
  let res;

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      query: {
        page: 2,
      },
    };

    list.mockReset();
    list.mockReturnValue({
      invitations: [
        {
          firstName: "User",
          lastName: "One",
          email: "user.one@unit.test",
          keyToSuccessId: "1234567",
          tokenSerialNumber: "1234567890",
          id: "c5e57976-0bef-4f55-b16f-f63a241c9bfa",
        },
      ],
      page: 2,
      numberOfPages: 12,
    });
  });

  it("then it should use page number from query string", async () => {
    await listInvitations(req, res);

    expect(list.mock.calls).toHaveLength(1);
    expect(list.mock.calls[0][0]).toBe(2);
    expect(list.mock.calls[0][1]).toBe(25);
  });

  it("then it should use page 1 if page number not in query string", async () => {
    req.query.page = undefined;

    await listInvitations(req, res);

    expect(list.mock.calls).toHaveLength(1);
    expect(list.mock.calls[0][0]).toBe(1);
    expect(list.mock.calls[0][1]).toBe(25);
  });

  it("then it should send invitations", async () => {
    await listInvitations(req, res);

    expect(res._getData()).toMatchObject({
      invitations: [
        {
          firstName: "User",
          lastName: "One",
          email: "user.one@unit.test",
          keyToSuccessId: "1234567",
          tokenSerialNumber: "1234567890",
          id: "c5e57976-0bef-4f55-b16f-f63a241c9bfa",
        },
      ],
      page: 2,
      numberOfPages: 12,
    });
    expect(res._isJSON()).toBe(true);
    expect(res._isEndCalled()).toBe(true);
  });
});

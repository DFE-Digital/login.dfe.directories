const httpMocks = require("node-mocks-http");
const findByEntraOid = require("../../src/app/user/api/findByEntraOidHandler");

const { addLegacyUsernames } = require("../../src/app/user/api/helpers");

jest.mock("../../src/app/user/api/helpers", () => {
  const original = jest.requireActual("../../src/app/user/api/helpers");
  return {
    ...original,
    addLegacyUsernames: jest.fn(),
  };
});

addLegacyUsernames.mockImplementation(() => null);

jest.mock("../../src/infrastructure/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock("./../../src/app/user/adapter", () => {
  const getFindByEntraOid = jest.fn().mockImplementation(() => undefined);
  return {
    getLegacyUsernames: jest.fn(),
    findByEntraOid: jest.fn().mockImplementation(getFindByEntraOid),
  };
});

const adaptor = require("../../src/app/user/adapter");

const fakeUserEntity = {
  id: 1,
  email: "bob@bob.com",
  entra_oid: "78071717-4247-480d-90a3-3d531379ebf8",
  is_entra: true,
  entra_linked: new Date(),
};

describe("When calling the findByEntraOid endpoint", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        entraOid: undefined,
      },
      header: jest.fn().mockReturnValue("correlation-id"),
    };
    res = httpMocks.createResponse();
  });

  it("should return a 400 is the entraOid parameter is missing", async () => {
    await findByEntraOid(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("should return a 400 is the entraOid parameter is present but not a Uuid", async () => {
    req.params.entraOid = "1234";

    await findByEntraOid(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("should return a 404 if entraOid and uuid is present but a user was not found", async () => {
    req.params.entraOid = "78071717-4247-480d-90a3-3d531379ebf8";

    await findByEntraOid(req, res);

    expect(res.statusCode).toBe(404);
  });

  it("should return a 200 if entraOid and uuid is present and a user was found", async () => {
    req.params.entraOid = "78071717-4247-480d-90a3-3d531379ebf8";

    adaptor.findByEntraOid.mockReturnValue(fakeUserEntity);

    const fakeUser = {
      id: 1,
      email: "bob@bob.com",
      entraOid: "78071717-4247-480d-90a3-3d531379ebf8",
      isEntra: true,
      entraLinked: fakeUserEntity.entra_linked,
    };

    await findByEntraOid(req, res);

    expect(res.statusCode).toBe(200);

    expect(res._getData()).toMatchObject(fakeUser);
  });

  it("should return a 500 in the event of an exception", async () => {
    req.params.entraOid = "78071717-4247-480d-90a3-3d531379ebf8";

    adaptor.findByEntraOid.mockImplementation(() => {
      throw new Error("User not found");
    });

    await findByEntraOid(req, res);

    expect(res.statusCode).toBe(500);
  });
});

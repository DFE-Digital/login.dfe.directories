const httpMocks = require("node-mocks-http");
const linkDsiUserWithEntra = require("../../src/app/user/api/linkDsiUserWithEntraHandler");
const adaptor = require("../../src/app/user/adapter");

const fakeUser = {
  sub: "78071717-4247-480d-90a3-3d531379ebf8",
  family_name: "f-anme",
  given_name: "g-name",
  is_entra: false,
  entra_oid: null,
  entra_linked: null,
};

jest.mock("./../../src/app/user/adapter", () => ({
  linkUserWithEntraOid: jest
    .fn()
    .mockImplementation((uid, entraOid, firstName, lastName) => {
      const cloned = structuredClone(fakeUser);

      cloned.sub = uid;
      cloned.family_name = lastName || cloned.family_name;
      cloned.given_name = firstName || cloned.given_name;
      cloned.entra_oid = entraOid || cloned.entra_oid;
      cloned.is_entra = !!entraOid;

      return cloned;
    }),
}));

jest.mock("./../../src/infrastructure/config", () => ({}));

jest.mock("../../src/infrastructure/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe("When calling the linkDsiUserWithEntra endpoint", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        uid: undefined,
      },
      body: {},
      header: jest.fn().mockReturnValue("correlation-id"),
    };
    res = httpMocks.createResponse();
  });

  it("should return a 404 if the uid and entraOid parameters are missing", async () => {
    await linkDsiUserWithEntra(req, res);
    expect(res.statusCode).toBe(404);
  });

  it("should return a 404 if the uid is provided by entraOid is missing", async () => {
    req.params.uid = "1234";

    await linkDsiUserWithEntra(req, res);
    expect(res.statusCode).toBe(404);
  });

  it("should return a 404 if the uid is not provided but entraOid has", async () => {
    req.body.entraOid = "1234";

    await linkDsiUserWithEntra(req, res);
    expect(res.statusCode).toBe(404);
  });

  it("should return a 404 if the uid in not a uuid", async () => {
    req.params.uid = "1234";
    req.body.entraOid = "78071717-4247-480d-90a3-3d531379ebf8";

    await linkDsiUserWithEntra(req, res);
    expect(res.statusCode).toBe(404);
  });

  it("should return a 404 if the entraOid in not a uuid", async () => {
    req.params.uid = "78071717-4247-480d-90a3-3d531379ebf8";
    req.body.entraOid = "1234";

    await linkDsiUserWithEntra(req, res);
    expect(res.statusCode).toBe(404);
  });

  it("should update uid, entraOid, firstName and lastname", async () => {
    req.params.uid = "78071717-4247-480d-90a3-3d531379ebf8";
    req.body.entraOid = "78071717-4247-480d-90a3-3d531379ebf8";
    req.body.firstName = "R";
    req.body.lastName = "W";

    await linkDsiUserWithEntra(req, res);

    expect(res.statusCode).toBe(200);

    expect(res._getData()).toMatchObject({
      sub: "78071717-4247-480d-90a3-3d531379ebf8",
      entraOid: "78071717-4247-480d-90a3-3d531379ebf8",
      family_name: "W",
      given_name: "R",
      isEntra: true,
    });
  });

  it("should update uid, entraOid and firstName", async () => {
    req.params.uid = "78071717-4247-480d-90a3-3d531379ebf8";
    req.body.entraOid = "78071717-4247-480d-90a3-3d531379ebf8";
    req.body.firstName = "R";

    await linkDsiUserWithEntra(req, res);

    expect(res.statusCode).toBe(200);

    expect(res._getData()).toMatchObject({
      sub: "78071717-4247-480d-90a3-3d531379ebf8",
      entraOid: "78071717-4247-480d-90a3-3d531379ebf8",
      family_name: fakeUser.family_name,
      given_name: "R",
      isEntra: true,
    });
  });

  it("should update uid, entraOid", async () => {
    req.params.uid = "78071717-4247-480d-90a3-3d531379ebf8";
    req.body.entraOid = "78071717-4247-480d-90a3-3d531379ebf8";

    await linkDsiUserWithEntra(req, res);

    expect(res.statusCode).toBe(200);

    expect(res._getData()).toMatchObject({
      sub: "78071717-4247-480d-90a3-3d531379ebf8",
      entraOid: "78071717-4247-480d-90a3-3d531379ebf8",
      family_name: fakeUser.family_name,
      given_name: fakeUser.given_name,
      isEntra: true,
    });
  });

  it("should update uid, entraOid but ignore blank firstName", async () => {
    req.params.uid = "78071717-4247-480d-90a3-3d531379ebf8";
    req.body.entraOid = "78071717-4247-480d-90a3-3d531379ebf8";
    req.body.fistName = "";

    await linkDsiUserWithEntra(req, res);

    expect(res.statusCode).toBe(200);

    expect(res._getData()).toMatchObject({
      sub: "78071717-4247-480d-90a3-3d531379ebf8",
      entraOid: "78071717-4247-480d-90a3-3d531379ebf8",
      family_name: fakeUser.family_name,
      given_name: fakeUser.given_name,
      isEntra: true,
    });
  });

  it("should update uid, entraOid but ignore blank lastName", async () => {
    req.params.uid = "78071717-4247-480d-90a3-3d531379ebf8";
    req.body.entraOid = "78071717-4247-480d-90a3-3d531379ebf8";
    req.body.lastName = "";

    await linkDsiUserWithEntra(req, res);

    expect(res.statusCode).toBe(200);

    expect(res._getData()).toMatchObject({
      sub: "78071717-4247-480d-90a3-3d531379ebf8",
      entraOid: "78071717-4247-480d-90a3-3d531379ebf8",
      family_name: fakeUser.family_name,
      given_name: fakeUser.given_name,
      isEntra: true,
    });
  });

  it("should return 404 if linkUserWithEntraOid returns null", async () => {
    req.params.entraOid = "78071717-4247-480d-90a3-3d531379ebf8";
    req.params.uid = "78071717-4247-480d-90a3-3d531379ebf8";

    adaptor.linkUserWithEntraOid.mockReturnValue(undefined);

    await linkDsiUserWithEntra(req, res);
    expect(res.statusCode).toBe(404);
  });
});

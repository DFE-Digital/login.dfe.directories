jest.mock("./../../src/app/invitations/data");
jest.mock("./../../src/infrastructure/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  audit: jest.fn(),
}));
jest.mock("login.dfe.jobs-client");
jest.mock("./../../src/infrastructure/config", () => ({
  redis: {
    url: "http://orgs.api.test",
  },
  notifications: {
    connectionString: "",
  },
  applications: {
    type: "static",
  },
  hostingEnvironment: {
    env: "test",
  },
  loggerSettings: {
    applicationName: "Directories - API",
  },
}));

jest.mock("./../../src/infrastructure/applications");

jest.mock("./../../src/app/invitations/data", () => ({
  getUserInvitation: jest.fn(),
  updateInvitation: jest.fn(),
}));

const httpMocks = require("node-mocks-http");
const invitationStorage = require("../../src/app/invitations/data");
const post = require("../../src/app/invitations/api/postResendInvitation");

describe("When resending an invitation", () => {
  let res;
  let req;
  const expectedEmailAddress = "test@local.com";
  const expectedFirstName = "Test";
  const expectedLastName = "User";
  const expectedInvitationId = "30ab55b5-9c27-45e9-9583-abb349b12f35";
  const expectedRequestCorrelationId = "41ab33e5-4c27-12e9-3451-abb349b12f35";
  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      params: {
        id: expectedInvitationId,
      },
      headers: {
        "x-correlation-id": expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };
  });
  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });

  it("then a bad request is returned if the request has not provided an invitation_id", async () => {
    req.params.id = "";

    await post(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("then if the invitation is not found a 404 is returned", async () => {
    invitationStorage.getUserInvitation.mockReset();

    invitationStorage.getUserInvitation.mockReturnValue(null);

    await post(req, res);

    expect(res.statusCode).toBe(404);
  });

  it("then it should resend invitation", async () => {
    invitationStorage.getUserInvitation.mockReturnValue({
      id: expectedInvitationId,
      email: expectedEmailAddress,
      firstName: expectedFirstName,
      lastName: expectedLastName,
      code: "XYZ987",
      selfStarted: true,
      origin: {
        clientId: "client1",
        redirectUri: "https://source.test",
      },
    });

    invitationStorage.updateInvitation.mockReturnValue({
      id: expectedInvitationId,
      email: expectedEmailAddress,
      firstName: expectedFirstName,
      lastName: expectedLastName,
      code: "XYZ987",
      selfStarted: true,
      origin: {
        clientId: "client1",
        redirectUri: "https://source.test",
      },
    });

    await post(req, res);

    expect(res._getData()).toEqual({
      id: expectedInvitationId,
      email: expectedEmailAddress,
      firstName: expectedFirstName,
      lastName: expectedLastName,
      code: "XYZ987",
      selfStarted: true,
      origin: {
        clientId: "client1",
        redirectUri: "https://source.test",
      },
    });
  });

  it("then it should send status 200", async () => {
    invitationStorage.getUserInvitation.mockReturnValue({
      id: expectedInvitationId,
      email: expectedEmailAddress,
      firstName: expectedFirstName,
      lastName: expectedLastName,
      code: "XYZ987",
      selfStarted: true,
      origin: {
        clientId: "client1",
        redirectUri: "https://source.test",
      },
    });

    await post(req, res);

    expect(res.statusCode).toBe(200);
  });

  it("then a 500 response is returned if there is an error", async () => {
    invitationStorage.getUserInvitation.mockReset();
    invitationStorage.getUserInvitation = () => {
      throw new Error();
    };

    await post(req, res);

    expect(res.statusCode).toBe(500);
  });
});

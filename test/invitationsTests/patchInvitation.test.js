jest.mock('./../../src/infrastructure/config', () => ({
  redis: {
    url: 'http://orgs.api.test',
  },
  notifications: {
    connectionString: '',
  },
  applications: {
    type: 'static',
  },
  loggerSettings: {
    applicationName: 'Directories-API',
  },
  hostingEnvironment: {
    applicationInsights: '6261c542-1f69-416d-80a9-a01cd0707a26',
  },
}));
jest.mock('./../../src/app/invitations/data', () => ({
  getUserInvitation: jest.fn(),
  updateInvitation: jest.fn(),
}));
jest.mock('./../../src/app/invitations/utils', () => ({
  generateInvitationCode: jest.fn(),
}));
jest.mock('login.dfe.notifications.client');
jest.mock('./../../src/infrastructure/applications');

jest.mock('./../../src/infrastructure/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  audit: jest.fn(),
}));

const httpMocks = require('node-mocks-http');
const notificationClient = require('login.dfe.notifications.client');
const { getUserInvitation, updateInvitation } = require('../../src/app/invitations/data');
const { generateInvitationCode } = require('../../src/app/invitations/utils');
const { getServiceById } = require('../../src/infrastructure/applications');
const patchInvitation = require('../../src/app/invitations/api/patchInvitation');

describe('When patching an invitation', () => {
  let req;
  let res;
  let sendInvitationStub;

  beforeEach(() => {
    req = {
      params: {
        id: '714d039d-92f7-4bc4-9422-63d194a7',
      },
      header: () => 'x-correlation-id',
      body: {
        isCompleted: true,
      },
    };

    res = httpMocks.createResponse();

    getUserInvitation.mockReset();
    getUserInvitation.mockReturnValue({
      email: 'severus.snape@hogwarts.test',
      firstName: 'Severus',
      lastName: 'Snape',
      origin: {
        clientId: 'client1',
        redirectUri: 'https://example.com',
      },
      selfStarted: false,
      code: 'existing-code',
      id: '714d039d-92f7-4bc4-9422-63d194a7',
    });

    generateInvitationCode.mockReset().mockReturnValue('new-code');

    getServiceById.mockReset().mockImplementation((id) => {
      if (id !== 'client1') {
        return undefined;
      }
      return {
        client_id: 'client1',
        client_secret: 'some-secure-secret',
        relyingParty: {
          redirect_uris: [
            'https://client.one/auth/cb',
            'https://client.one/register/complete',
          ],
          post_logout_redirect_uris: [
            'https://client.one/signout/complete',
          ],
          params: {
            digipassRequired: true,
          },
        },
        name: 'Client One',
      };
    });

    sendInvitationStub = jest.fn();
    notificationClient.mockReset().mockImplementation(() => ({
      sendInvitation: sendInvitationStub,
    }));
  });

  it('then it should return 400 - Bad request if no keys in body', async () => {
    req.body = {};

    await patchInvitation(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toBe('No properties specified for patching');
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return 400 - Bad request if invalid key specified in body', async () => {
    req.body = {
      isCompleted: true,
      bad1: 1,
      bad2: false,
    };

    await patchInvitation(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toBe('Invalid property patched - bad1. Patchable properties are email,isCompleted,deactivated,reason,callbacks');
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it allows deactivated and reason to be patched', async () => {
    req.body = {
      isCompleted: true,
      deactivated: true,
      reason: 'test reason',
    };

    await patchInvitation(req, res);

    expect(res.statusCode).toBe(202);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return 404 - Not found if invitation is not found', async () => {
    getUserInvitation.mockReturnValue(null);

    await patchInvitation(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should store patched invitation', async () => {
    await patchInvitation(req, res);

    expect(updateInvitation.mock.calls).toHaveLength(1);
    expect(updateInvitation.mock.calls[0][0]).toMatchObject({
      email: 'severus.snape@hogwarts.test',
      firstName: 'Severus',
      lastName: 'Snape',
      origin: {
        clientId: 'client1',
        redirectUri: 'https://example.com',
      },
      selfStarted: false,
      code: 'new-code',
      id: '714d039d-92f7-4bc4-9422-63d194a7',
      isCompleted: true,
    });
  });

  it('then it allows email to be patched', async () => {
    req.body = {
      email: 'new.email@unit.test',
    };

    await patchInvitation(req, res);

    expect(res.statusCode).toBe(202);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should update email if email has changed', async () => {
    req.body = {
      email: 'new.email@unit.test',
    };

    await patchInvitation(req, res);

    expect(updateInvitation.mock.calls).toHaveLength(1);
    expect(updateInvitation.mock.calls[0][0]).toMatchObject({
      email: 'new.email@unit.test',
    });
  });

  it('then it should update invitation code if email has changed', async () => {
    req.body = {
      email: 'new.email@unit.test',
    };

    await patchInvitation(req, res);

    expect(updateInvitation.mock.calls).toHaveLength(1);
    expect(updateInvitation.mock.calls[0][0]).toMatchObject({
      code: 'new-code',
    });
  });

  it('then it should send invitation to new address with new code if email has changed', async () => {
    req.body = {
      email: 'new.email@unit.test',
    };

    await patchInvitation(req, res);

    expect(sendInvitationStub.mock.calls).toHaveLength(1);
    expect(sendInvitationStub.mock.calls[0][0]).toBe('new.email@unit.test');
    expect(sendInvitationStub.mock.calls[0][1]).toBe('Severus');
    expect(sendInvitationStub.mock.calls[0][2]).toBe('Snape');
    expect(sendInvitationStub.mock.calls[0][3]).toBe('714d039d-92f7-4bc4-9422-63d194a7');
    expect(sendInvitationStub.mock.calls[0][4]).toBe('new-code');
    expect(sendInvitationStub.mock.calls[0][5]).toBe('Client One');
    expect(sendInvitationStub.mock.calls[0][6]).toBe(true);
    expect(sendInvitationStub.mock.calls[0][7]).toBe(false);
  });

  // The below two test is not needed any more after commit #3f283f0

  // it('then it should not update invitation code if email has not changed', async () => {
  //   await patchInvitation(req, res);

  //   expect(updateInvitation.mock.calls).toHaveLength(1);
  //   expect(updateInvitation.mock.calls[0][0]).toMatchObject({
  //     code: 'existing-code',
  //   });
  // });

  //   it('then it should not send invitation if email has not changed', async () => {
  //     await patchInvitation(req, res);

  //     expect(sendInvitationStub.mock.calls).toHaveLength(0);
  //   });
});

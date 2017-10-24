jest.mock('activedirectory');
jest.mock('login.dfe.request-verification');

const UserAzureActiveDirectoryAdapter = require('../../src/app/user/adapter/UserAzureActiveDirectoryAdapter');

describe('When using the UserAzureActiveDirectoryAdapter', () => {
  const user = {
    dn: 'test',
    givenName: 'Test',
    sn: 'Tester',
    userPrincipalName: 'test@localuser.com'
  };

  let activeDirectoryStub;
  let findUserStub;
  let authenticateStub;
  let configStub = {
    url: 'testUrl',
  };

  beforeEach(()=>{
    findUserStub = jest.fn().mockImplementation((options, userName, callback)=>{
        callback(null, user);
    });
    authenticateStub = jest.fn().mockImplementation((userName, password, callback) => {
      callback(null, true);
    });

    activeDirectoryStub = require('activedirectory');
    activeDirectoryStub.mockImplementation((configStub) => {
      return {
        findUser : findUserStub,
        authenticate : authenticateStub
      }
    });
  });
  describe('and finding user by email', () => {
    it('the user is read from active directory', async () => {
      const expectedUserName = 'test';
      const adapter = new UserAzureActiveDirectoryAdapter(configStub);

      const actual = await adapter.find(expectedUserName);

      expect(findUserStub.mock.calls.length).toBe(1);
      expect(findUserStub.mock.calls[0][1]).toBe(expectedUserName);
      expect(actual).not.toBeNull();
      expect(actual.sub).toEqual(user.dn);
      expect(actual.given_name).toEqual(user.givenName);
      expect(actual.family_name).toEqual(user.sn);
      expect(actual.email).toEqual(user.userPrincipalName);
    });
  });
  describe('and authenticating', () => {
    it('then the username and password are checked against the active directory', async () => {
      const expectedUserName = 'test';
      const expectedPassword = 'p@ssw0rd';
      const adapter = new UserAzureActiveDirectoryAdapter(configStub);

      const actual = await adapter.authenticate(expectedUserName, expectedPassword, null);

      expect(authenticateStub.mock.calls.length).toBe(1);
      expect(authenticateStub.mock.calls[0][0]).toBe(expectedUserName);
      expect(authenticateStub.mock.calls[0][1]).toBe(expectedPassword);
      expect(actual).not.toBeNull();
      expect(actual.sub).toBe(user.dn);
      expect(actual.given_name).toBe(user.givenName);
      expect(actual.family_name).toBe(user.sn);
      expect(actual.email).toBe(user.userPrincipalName);

    });
  });
  it('and it is constructed from the config options', () => {
    const expectedUrl = 'test-url';
    const expectedBasedDN = 'testBaseDN';
    const expectedUsername = 'test-username';
    const expectedPassword = 'test-password';
    configStub = {
      url: expectedUrl,
      baseDN: expectedBasedDN,
      username: expectedUsername,
      password: expectedPassword
    };

    new UserAzureActiveDirectoryAdapter(configStub);

    expect(activeDirectoryStub.mock.calls.length).toBe(1);
    expect(activeDirectoryStub.mock.calls[0][0].url).toBe(expectedUrl);
    expect(activeDirectoryStub.mock.calls[0][0].baseDN).toBe(expectedBasedDN);
    expect(activeDirectoryStub.mock.calls[0][0].username).toBe(expectedUsername);
    expect(activeDirectoryStub.mock.calls[0][0].password).toBe(expectedPassword);

  });
});

const expect = require('chai').expect;
const proxyquire = require('proxyquire')

const user = {
  dn: 'test',
  givenName: 'Test',
  sn: 'Tester',
  userPrincipalName: 'test@localuser.com'
}; // '{"email": "test@localuser.com", "first_name": "Test", "last_name" : "Tester"}';

describe('When using the UserAzureActiveDirectoryAdapter', () => {
  describe('and finding user by email', function () {
    it('the user is read from active directory', async function () {
      const expectedUserName = 'test';
      const configStub = {
        url: 'testUrl',
      };
      const activeDirectoryStub = function () {
        this.findUser = function (options, userName, callback) {
          if (userName === expectedUserName) {
            callback(null, user);
          } else {
            callback(null, null);
          }
        };
      };
      const UserAzureActiveDirectoryAdapter = proxyquire('../../src/user/UserAzureActiveDirectoryAdapter', {'activedirectory': activeDirectoryStub});

      const adapter = new UserAzureActiveDirectoryAdapter(configStub);
      const actual = await adapter.find(expectedUserName);

      expect(actual).to.not.be.null;
      expect(actual.sub).to.equal(user.dn);
      expect(actual.given_name).to.equal(user.givenName);
      expect(actual.family_name).to.equal(user.sn);
      expect(actual.email).to.equal(user.userPrincipalName);
    });
  });
  describe('and authenticating', function () {
    it('then the username and password are checked against the active directory', async function () {
      const expectedUserName = 'test';
      const expectedPassword = 'p@ssw0rd';
      const configStub = {
          url: 'testUrl',
      };
      const activeDirectoryStub = function () {
        this.authenticate = function (userName, password, callback) {
          if (userName === expectedUserName && password === expectedPassword) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        };
        this.findUser = function(opts, username, callback) {
          callback(null, user);
        };
      };

      const requestVerificationStub = function () {
        this.verifyRequest = function (contents, cert, sig) {
          return true;
        }
      };

      const UserAzureActiveDirectoryAdapter = proxyquire('../../src/user/UserAzureActiveDirectoryAdapter', {
        'activedirectory': activeDirectoryStub,
        'login.dfe.request-verification': requestVerificationStub
      });

      const adapter = new UserAzureActiveDirectoryAdapter(configStub);
      const actual = await adapter.authenticate(expectedUserName, expectedPassword, null);

      expect(actual).to.not.be.null;
      expect(actual.sub).to.equal(user.dn);
      expect(actual.given_name).to.equal(user.givenName);
      expect(actual.family_name).to.equal(user.sn);
      expect(actual.email).to.equal(user.userPrincipalName);

    });
  });
  it('and it is constructed from the config options', function () {

    const expectedUrl = 'testurl';
    const expectedBasedDN = 'testBaseDN';
    const expectedUsername = 'testusername';
    const expectedPassword = 'testpassword';
    const configStub = {
      url: expectedUrl,
      baseDN: expectedBasedDN,
      username: expectedUsername,
      password: expectedPassword
    };
    let actualUrl = '';
    let actualBaseDN = '';
    let actualUsername = '';
    let actualPassword = '';

    const activeDirectoryStub = function (configuration) {

      actualUrl = configuration.url;
      actualBaseDN = configuration.baseDN;
      actualUsername = configuration.username;
      actualPassword = configuration.password;

      this.userExists = function (options, userName, callback) {
        actualUrl = this.url;
        callback(null, true);
      }
    };

    var UserAzureActiveDirectoryAdapter = proxyquire('../../src/user/UserAzureActiveDirectoryAdapter', {'activedirectory': activeDirectoryStub});

    new UserAzureActiveDirectoryAdapter(configStub);

    expect(actualUrl).to.equal(expectedUrl);
    expect(actualPassword).to.equal(expectedPassword);
    expect(actualBaseDN).to.equal(expectedBasedDN);
    expect(actualUsername).to.equal(expectedUsername);
  });
})

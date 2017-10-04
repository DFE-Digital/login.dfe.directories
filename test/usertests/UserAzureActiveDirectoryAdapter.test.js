const expect = require('chai').expect;
const proxyquire = require('proxyquire')

const user = '{"email": "test@localuser.com", "first_name": "Test", "last_name" : "Tester"}';

describe('When using the UserAzureActiveDirectoryAdapter', () => {
  describe('and finding user by email', function () {
    it('the user is read from active directory', async function () {
      let expectedUserName = 'test';
      const configStub = {ldapConfiguration:{
        url : "testUrl"
      }};
      const activeDirectoryStub = function() {
        this.findUser = function(options, userName, callback) {
          if(userName === expectedUserName){
            callback(null, user);
          }else {
            callback(null, null);
          }
        }
      };
      var UserAzureActiveDirectoryAdapter = proxyquire('../../src/user/UserAzureActiveDirectoryAdapter', {'activedirectory': activeDirectoryStub});

      var adapter = new UserAzureActiveDirectoryAdapter(configStub);
      let actual = await adapter.find(expectedUserName);

      expect(actual).to.equal(user);
    });
  });
  describe('and authenticating', function () {
    it('then the username and password are checked against the active directory', async function () {
      let expectedUserName = 'test';
      let expectedPassword = 'p@ssw0rd';
      const configStub = {ldapConfiguration:{
        url : "testUrl"
      }};
      const activeDirectoryStub = function () {
        this.authenticate = function (userName, password, callback) {
          if (userName === expectedUserName && password === expectedPassword) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        }
      };

      const requestVerificationStub = function () {
        this.verifyRequest = function (contents, cert, sig) {
          return true;
        }
      };

      var UserAzureActiveDirectoryAdapter = proxyquire('../../src/user/UserAzureActiveDirectoryAdapter', {
        'activedirectory': activeDirectoryStub,
        'login.dfe.request-verification': requestVerificationStub
      });

      var adapter = new UserAzureActiveDirectoryAdapter(configStub);
      let actual = await adapter.authenticate(expectedUserName, expectedPassword, null);

      expect(actual).to.equal(true);

    });
  });
  it('and it is constructed from the config options', function(){

    let expectedUrl = 'testurl';
    let expectedBasedDN = 'testBaseDN';
    let expectedUsername = 'testusername';
    let expectedPassword = 'testpassword';
    const configStub = {ldapConfiguration:{
      url : expectedUrl,
      baseDN : expectedBasedDN,
      username: expectedUsername,
      password: expectedPassword
    }};
    let actualUrl = '';
    let actualBaseDN = '';
    let actualUsername = '';
    let actualPassword = '';

    const activeDirectoryStub = function(configuration) {

      actualUrl = configuration.url;
      actualBaseDN = configuration.baseDN;
      actualUsername = configuration.username;
      actualPassword = configuration.password;

      this.userExists = function(options, userName, callback) {
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

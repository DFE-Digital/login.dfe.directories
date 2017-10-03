const expect = require('chai').expect;
const proxyquire = require('proxyquire')

const user = '{"email": "test@localuser.com", "first_name": "Test", "last_name" : "Tester"}';

describe('When using the UserAzureActiveDirectoryAdapter', () => {
  describe('and finding user by email', function () {
    it('the user is read from active directory', async function () {
      let expectedUserName = 'test';

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

      var adapter = new UserAzureActiveDirectoryAdapter();
      let actual = await adapter.find(expectedUserName);

      expect(actual).to.equal(user);
    });
  });
  describe('and authenticating', function () {
    it('then the username and password are checked against the active directory', async function(){
      let expectedUserName = 'test';
      let expectedPassword = 'p@ssw0rd';

      const activeDirectoryStub = function() {
        this.authenticate = function(userName, password, callback) {
          if(userName === expectedUserName && password === expectedPassword){
            callback(null, true);
          }else {
            callback(null, false);
          }
        }
      };

      const requestVerificationStub = function() {
        this.verifyRequest = function(contents, cert, sig){
          return true;
        }
      };

      var UserAzureActiveDirectoryAdapter = proxyquire('../../src/user/UserAzureActiveDirectoryAdapter', {'activedirectory': activeDirectoryStub,'login.dfe.request-verification': requestVerificationStub});

      var adapter = new UserAzureActiveDirectoryAdapter();
      let actual = await adapter.authenticate(expectedUserName,expectedPassword,null);

      expect(actual).to.equal(true);

    })
    it('then the signature is validated', async function(){
      let expectedUserName = 'test';
      let expectedPassword = 'p@ssw0rd';
      let expectedSignature = "sig";
      let expectedCertLocation = 'mycert';

      const configStub = {RequestVerificationCertification: expectedCertLocation};

      const activeDirectoryStub = function() {
        this.authenticate = function(userName, password, callback) {
          if(userName === expectedUserName && password === expectedPassword){
            callback(null, true);
          }else {
            callback(null, false);
          }
        }
      };

      const requestVerificationStub = function() {
        this.verifyRequest = function(contents, cert, sig){

          var content = JSON.stringify({ username: expectedUserName, password: expectedPassword });

          if(content === contents && sig === expectedSignature && cert === expectedCertLocation){
            return true;
          }
          return false;
        }
      };

      var UserAzureActiveDirectoryAdapter = proxyquire('../../src/user/UserAzureActiveDirectoryAdapter', {'activedirectory': activeDirectoryStub,'login.dfe.request-verification': requestVerificationStub, './../config' : configStub});

      var adapter = new UserAzureActiveDirectoryAdapter();
      let actual = await adapter.authenticate(expectedUserName,expectedPassword,expectedSignature);

      expect(actual).to.equal(true);
    })
    it('then a message is returned if the signature is not valid', async function(){
      const requestVerificationStub = function() {
        this.verifyRequest = function(contents, cert, sig){
          return false;
        }
      };
      var UserAzureActiveDirectoryAdapter = proxyquire('../../src/user/UserAzureActiveDirectoryAdapter', {'login.dfe.request-verification': requestVerificationStub});

      var adapter = new UserAzureActiveDirectoryAdapter();
      try{
        await adapter.authenticate('test','password',null);
      }catch(e)
      {
        expect(e).to.equal('Can not verify request');
      }
    })
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

    var UserAzureActiveDirectoryAdapter = proxyquire('../../src/user/UserAzureActiveDirectoryAdapter', {'activedirectory': activeDirectoryStub, './../config' : configStub});

    new UserAzureActiveDirectoryAdapter();

    expect(actualUrl).to.equal(expectedUrl);
    expect(actualPassword).to.equal(expectedPassword);
    expect(actualBaseDN).to.equal(expectedBasedDN);
    expect(actualUsername).to.equal(expectedUsername);
  });
})
;
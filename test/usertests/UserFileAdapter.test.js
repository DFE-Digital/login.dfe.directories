const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const users = '[{"sub": "user1", "email": "test@localuser.com", "given_name": "Test", "family_name" : "Tester"}, {"sub": "user1", "email": "demo@localuser.com", "given_name": "Demo", "family_name" : "Strator"}]';

describe('When using the UsersFileAdapter', () => {
  describe('and finding user by Id', function () {

    let adapter;
    let readFileCallbackInvoker;
    let readFilePath;
    let readFileOpts;

    beforeEach(() => {
      readFilePath = undefined;
      readFileOpts = undefined;
      readFileCallbackInvoker = (callback) => {
        callback(null, users);
      };
      const UserFileAdapter = proxyquire('../../src/user/UserFileAdapter', {
        'fs': {
          readFile: function(path, opts, callback) {
            readFilePath = path;
            readFileOpts = opts;
            readFileCallbackInvoker(callback);
          },
        },
      });
      adapter = new UserFileAdapter();
    });

    it('the user are read from the users.json in app_data', function () {
      adapter.find('test@user');

      expect(readFilePath).to.match(/\/app_data\/users\.json$/);
      expect(readFileOpts.encoding).to.equal('utf8');
    });
    it('null is returned if there is no data in the file', function()  {
      readFileCallbackInvoker = (callback) => {
        callback(null, null);
      };

      return adapter.find('test@user').then( function(actual) {
        expect(actual).to.equal(null);
      });

    });
    it('the user is returned if the Id matches the sub', function(){
      return adapter.find('user1').then(function(actual) {
        expect(actual).to.not.equal(null);
        expect(actual.given_name).to.equal('Test');
      });
    });
    it('null is returned if the Id is not found', function() {
      return adapter.find('user1a').then( function(actual) {
        expect(actual).to.equal(null);
      });
    });
  });
});

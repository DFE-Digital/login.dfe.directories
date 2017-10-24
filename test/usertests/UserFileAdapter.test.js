jest.mock('fs');
const UserFileAdapter = require('./../../src/app/user/adapter/UserFileAdapter');

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

      const fsMock = require('fs');
      fsMock.readFile = (path, opts, callback) => {
        readFilePath = path;
        readFileOpts = opts;
        readFileCallbackInvoker(callback);
      };

      adapter = new UserFileAdapter();
    });

    it('the user are read from the users.json in app_data', function () {
      adapter.find('test@user');

      expect(readFilePath).toMatch(/\/app_data\/users\.json$/);
      expect(readFileOpts.encoding).toBe('utf8');
    });
    it('null is returned if there is no data in the file', function()  {
      readFileCallbackInvoker = (callback) => {
        callback(null, null);
      };

      return adapter.find('test@user').then( function(actual) {
        expect(actual).toBe(null);
      });

    });
    it('the user is returned if the Id matches the sub', function(){
      return adapter.find('user1').then(function(actual) {
        expect(actual).not.toBe(null);
        expect(actual.given_name).toBe('Test');
      });
    });
    it('null is returned if the Id is not found', function() {
      return adapter.find('user1a').then( function(actual) {
        expect(actual).toBe(null);
      });
    });
  });
});

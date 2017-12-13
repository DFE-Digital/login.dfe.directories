jest.mock('fs');
const adapter = require('./../../src/app/user/adapter/UserFileAdapter');
const fsMock = require('fs');

const users = '[{"sub": "user1", "email": "test@localuser.com", "given_name": "Test", "family_name" : "Tester"}, {"sub": "user1", "email": "demo@localuser.com", "given_name": "Demo", "family_name" : "Strator"}]';

describe('When using the UsersFileAdapter', () => {
  describe('and finding user by Id', () => {

    let readFileCallbackInvoker;
    let readFilePath;
    let readFileOpts;

    beforeEach(() => {
      readFilePath = undefined;
      readFileOpts = undefined;
      readFileCallbackInvoker = (callback) => {
        callback(null, users);
      };

      fsMock.readFile = (path, opts, callback) => {
        readFilePath = path;
        readFileOpts = opts;
        readFileCallbackInvoker(callback);
      };
    });
    it('the user are read from the users.json in app_data', async () => {
      await adapter.find('test@user');

      expect(readFilePath).toMatch(/\/app_data\/users\.json$/);
      expect(readFileOpts.encoding).toBe('utf8');
    });
    it('null is returned if there is no data in the file', async () =>  {
      readFileCallbackInvoker = (callback) => {
        callback(null, null);
      };

      const actual = await adapter.find('test@user');

      expect(actual).toBeNull();
    });
    it('the user is returned if the Id matches the sub', async () => {
      const actual = await adapter.find('user1');

      expect(actual).not.toBe(null);
      expect(actual.given_name).toBe('Test');
    });
    it('null is returned if the Id is not found', async () => {
      const actual = await adapter.find('user1a');

      expect(actual).toBeNull();
    });
  });
});

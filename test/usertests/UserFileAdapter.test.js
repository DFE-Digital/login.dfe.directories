const expect = require('chai').expect;
const sinon = require('sinon');
const file = require('fs');
const path = require('path');
const UserFileAdapter = require('../../src/user/UserFileAdapter');

const users = '[{"id": "test@localuser.com", "first_name": "Test", "last_name" : "Tester"}, {"id": "demo@localuser.com", "first_name": "Demo", "last_name" : "Strator"}]';

describe('When using the UsersFileAdapter', () => {
  describe('and finding user by Id', function () {

    let adapter;
    let sandbox;

    beforeEach(function () {
      adapter = new UserFileAdapter();
      sandbox = sinon.sandbox.create();
    });
    afterEach(function () {
      sandbox.restore();
    });
    it('the user are read from the users.json in app_data', function () {
      const mock = sinon.mock(file);
      mock.expects('readFileSync').withArgs(path.resolve('./app_data/users.json'), {encoding: 'utf8' }).once().returns('[{}]');

      adapter.find('test@user');

      mock.verify();
    });
    it('null is returned if there is no data in the file', function()  {
      sandbox.stub(file,'readFileSync').returns(null);

      return adapter.find('test@user').then( function(actual) {
        expect(actual).to.equal(null);
      });

    });
    it('the client is returned if the Id matches the client_id', function(){
      sandbox.stub(file,'readFileSync').returns(users);
      return adapter.find('test@localuser.com').then( function(actual) {
        expect(actual).to.not.equal(null);
        expect(actual.first_name).to.equal('Test');
      });
    });
    it('null is returned if the Id is not found', function() {
      sandbox.stub(file,'readFileSync').returns(users);

      return adapter.find('test2@localuser.com').then( function(actual) {
        expect(actual).to.equal(null);
      });
    });
  });
});

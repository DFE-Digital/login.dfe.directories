const expect = require('chai').expect;
const deleteUserCode = require('./../../src/userCodes/delete');
const httpMocks = require('node-mocks-http');
const proxyquire = require('proxyquire');

describe('When deleting a user code', () => {
  let req;
  let res;

  class storageMock  {
    constructor(){

    }
    async deleteUserPasswordResetCode() {
      return new Promise((resolve)=>{
        resolve();
      })
    }
    close() {
      return;
    }
  };
  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      params:{
        uid: '7654321',
        code: 'ABC123'
      }
    };
  });
  it('then a bad request is returned if the uid is not supplied', async () => {
    //todo look at why when this fails it doesn't cause the test runner to stop
    const uidValues = ['',undefined,null];

    await uidValues.map(async (valueToUse) =>{
      req.params.uid = valueToUse;

      await deleteUserCode(req,res);
      expect(res.statusCode).to.deep.equal(400);
    });
  });
  it('then a 200 response code is returned if the uid is provided', async () =>{
    const deleteNew = proxyquire('./../../src/userCodes/delete', {'./redisUserCodeStorage': storageMock});

    await deleteNew(req,res);

    expect(res.statusCode).to.deep.equal(200);
  })
});
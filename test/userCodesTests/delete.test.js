jest.mock('./../../src/app/userCodes/data/redisUserCodeStorage');
const deleteUserCode = require('./../../src/app/userCodes/api/delete');
const httpMocks = require('node-mocks-http');

describe('When deleting a user code', () => {
  let req;
  let res;
  let deleteUserStub;
  let redisUserCodeStorage;

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      params:{
        uid: '7654321',
        code: 'ABC123'
      }
    };
    deleteUserStub = jest.fn().mockImplementation(()=>{ return new Promise((resolve)=>{      resolve();    })});

    redisUserCodeStorage = require('./../../src/app/userCodes/data/redisUserCodeStorage');
    redisUserCodeStorage.mockImplementation(() => {
      return {
        deleteUserPasswordResetCode : deleteUserStub
      }
    });
  });
  it('then a bad request is returned if the uid is not supplied', async () => {
    //todo look at why when this fails it doesn't cause the test runner to stop
    const uidValues = ['',undefined,null];

    await uidValues.map(async (valueToUse) =>{
      req.params.uid = valueToUse;

      await deleteUserCode(req,res);
      expect(res.statusCode).toBe(400);
    });
  });
  it('then a 200 response code is returned if the uid is provided', async () =>{

    await deleteUserCode(req,res);

    expect(res.statusCode).toBe(200);
  })
});
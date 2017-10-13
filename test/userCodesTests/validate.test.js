const expect = require('chai').expect;
const validate = require('./../../src/userCodes/validate');
const httpMocks = require('node-mocks-http');
const proxyquire = require('proxyquire');

describe('When validating a user code', () => {
  let req;
  let res;
  let getResponse = {uid:'7654321',code:'ABC123'};

  class storageMock  {
    constructor(){

    }
    async getUserPasswordResetCode() {
      return new Promise((resolve)=>{
        resolve(getResponse);
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
  it('then an empty response is returned and a bad request status code sent if there is no uid', async ()=> {

    //todo look at why when this fails it doesn't cause the test runner to stop
    const uidValues = ['',undefined,null];

    await uidValues.map(async (valueToUse) =>{
      req.params.uid = valueToUse;

      await validate(req,res);
      expect(res.statusCode).to.deep.equal(400);
    });


  });
  it('then an empty response is returned and a bad request status code sent if there is no code', async ()=> {
    //todo look at why when this fails it doesn't cause the test runner to stop
    const uidValues = ['',undefined,null];

    await uidValues.map(async (valueToUse) =>{
      req.params.code = valueToUse;

      await validate(req,res);
      expect(res.statusCode).to.deep.equal(400);
    })

  });
  it('then if a code exists for the uid and the code matches a successful response is returned', async () => {

    getResponse = {uid:'7654321',code:'ABC123'};

    const postNew = proxyquire('./../../src/userCodes/validate', {'./redisUserCodeStorage': storageMock});

    await postNew(req, res);

    expect(res._getData().code).to.deep.equal('ABC123');
    expect(res._getData().uid).to.deep.equal('7654321');

  });
  it('then if the code does not match then a 404 response is returned', async () => {
    getResponse = {uid:'7654321',code:'ZXY789'};

    const postNew = proxyquire('./../../src/userCodes/validate', {'./redisUserCodeStorage': storageMock});

    await postNew(req, res);

    expect(res.statusCode).to.deep.equal(404);

  })
});
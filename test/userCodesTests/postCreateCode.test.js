const expect = require('chai').expect;
const post = require('./../../src/userCodes/postCreateCode');
const httpMocks = require('node-mocks-http');
const proxyquire = require('proxyquire');

describe('When getting a user code', () => {
  let req;
  let res;
  let getResponse = null;
  let createResponse = {uid:'7654321',code:'ABC123'}

  class storageMock  {
    constructor(){

    }
    async getUserPasswordResetCode() {
      return new Promise((resolve)=>{
        resolve(getResponse);
      })
    }
    async createUserPasswordResetCode(){
      return new Promise((resolve)=>{
        resolve(createResponse);
      })
    }
    close() {
      return;
    }
  };

  beforeEach(() => {
    res = httpMocks.createResponse();
    req = {
      body: {
        uid: '7654321'
      }
    };
  })
  it('then an empty response is returned if the uid is not passed and the status code set to bad request', async () => {
    req.body.uid = '';

    await post(req, res);

    expect(res.statusCode).to.equal(400);
  });
  it('then a code is generated if the uid is supplied', async () => {

    const postNew = proxyquire('./../../src/userCodes/postCreateCode', {'./redisUserCodeStorage': storageMock});

    postNew(req, res).then((actual)=>{
      expect(res._getData().code).to.deep.equal('ABC123')
      expect(res._getData().uid).to.deep.equal('7654321')
    });


  });
  it('then if a code exists for a uid the same one is returned', async () => {

    getResponse = {uid:'7654321',code:'ZXY789'};

    const postNew = proxyquire('./../../src/userCodes/postCreateCode', {'./redisUserCodeStorage': storageMock});

    postNew(req, res).then((actual)=>{
      expect(res._getData().code).to.deep.equal('ZXY789')
      expect(res._getData().uid).to.deep.equal('7654321')
    });

  });
});

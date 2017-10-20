const expect = require('chai').expect;
const put = require('../../src/app/userCodes/api/putUpsertCode');
const httpMocks = require('node-mocks-http');
const proxyquire = require('proxyquire');

describe('When getting a user code', () => {
  const expectedEmailAddress = 'test@unit.local';
  let req;
  let res;
  let getResponse = null;
  let createResponse = {uid:'7654321',code:'ABC123'}
  let emailObject;

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
  }

  const userMock = {
    async find() {
      return {
        email: expectedEmailAddress
      };
    }
  };

  class notificationMock {
    constructor() {

    }
    async sendPasswordReset(email, code){
      emailObject = {
        email,
        code
      };
    }
  }



  beforeEach(() => {
    getResponse = null;
    res = httpMocks.createResponse();
    req = {
      body: {
        uid: '7654321',
        clientId: 'client1'
      }
    };
  });
  it('then an empty response is returned if the uid is not passed and the status code set to bad request', async () => {
    req.body.uid = '';

    await put(req, res);

    expect(res.statusCode).to.equal(400);
  });
  it('then an empty response is returned if the client is not passed and the status code set to bad request', async () => {
    req.body.clientId = '';

    await put(req, res);

    expect(res.statusCode).to.equal(400);
  });
  it('then a code is generated if the uid is supplied', async () => {

    const putNew = proxyquire('./../../src/userCodes/putUpsertCode', {
      './redisUserCodeStorage': storageMock,
      'login.dfe.notifications.client':notificationMock,
      './../user/adapter':userMock,
      './../config':
        {
          notifications:{
            connectionString:''
          }
        },
    });

    await putNew(req, res);

    expect(res._getData().code).to.deep.equal('ABC123');
    expect(res._getData().uid).to.deep.equal('7654321');
  });
  it('then if a code exists for a uid the same one is returned', async () => {

    getResponse = {uid:'7654321',code:'ZXY789'};

    const putNew = proxyquire('./../../src/userCodes/putUpsertCode', {
      './redisUserCodeStorage': storageMock,
      'login.dfe.notifications.client':notificationMock,
      './../user/adapter':userMock,
      './../config':
        {
          notifications:{
            connectionString:''
          }
        },
    });

    await putNew(req, res);

    expect(res._getData().code).to.deep.equal('ZXY789');
    expect(res._getData().uid).to.deep.equal('7654321');


  });
  it('then an email is sent with the code', async () => {
    const putNew = proxyquire('./../../src/userCodes/putUpsertCode', {
      './redisUserCodeStorage': storageMock,
      'login.dfe.notifications.client':notificationMock,
      './../user/adapter':userMock,
      './../config':
        {
          notifications:{
            connectionString:''
          }
        },
    });

    await putNew(req, res);

    expect(emailObject.code).to.equal('ABC123')
    expect(emailObject.email).to.equal(expectedEmailAddress);
  });
});

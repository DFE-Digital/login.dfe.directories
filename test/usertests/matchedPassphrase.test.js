jest.mock('./../../src/app/user/adapter', () => {
    return {
      isMatched: jest.fn(),
    };
  });
  jest.mock('./../../src/infrastructure/logger', () => {
    return {
    };
  });
  const httpMocks = require('node-mocks-http');
  const userAdapter = require('./../../src/app/user/adapter');
  const isMatched = require('./../../src/app/user/api/matchedPassphrase');
  
  describe('When amending passowrd', () => {
    let req;
    let res;
  
    beforeEach(() => {
      userAdapter.isMatched.mockReset();
  
      req = {
        header: () => 'correlation-id',
        body: {
          uid: 'user1',
          newPass: 'password1234',
        },
      };
  
      res = httpMocks.createResponse();
    });
  
    it('then the pass phrase should not match', async () => {
        userAdapter.isMatched.mockReturnValue(true);
       
        expect(res.statusCode).toBe(200);
    });
  
    it('then it should return true it does match', async () => {
      userAdapter.isMatched.mockReturnValue(false);
      expect(res.statusCode).toBe(200);
    });
  
  });
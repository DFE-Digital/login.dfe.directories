jest.mock('./../../src/app/user/adapter', () => {
  return {
    authenticate: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');
const userAdapter = require('./../../src/app/user/adapter');
const authenticate = require('./../../src/app/user/api/authenticate');

describe('When authenticating a user request', () => {
  let req;
  let res;

  beforeEach(() => {
    userAdapter.authenticate.mockReset();

    req = {
      header: () => 'correlation-id',
      body: {
        username: 'user.one@unit.test',
        password: 'password1234',
      },
    };

    res = httpMocks.createResponse();
  });

  it('then it should authenticate with adapter using posted credentials', async () => {
    userAdapter.authenticate.mockReturnValue({
      sub: 'user1',
      status: 1,
    });

    await authenticate(req, res);

    expect(userAdapter.authenticate.mock.calls).toHaveLength(1);
    expect(userAdapter.authenticate.mock.calls[0][0]).toBe('user.one@unit.test');
    expect(userAdapter.authenticate.mock.calls[0][1]).toBe('password1234');
    expect(userAdapter.authenticate.mock.calls[0][2]).toBe('correlation-id');
  });

  it('then it should return 200 with user sub if successful', async () => {
    userAdapter.authenticate.mockReturnValue({
      sub: 'user1',
      status: 1,
    });

    await authenticate(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getData()).toBe('user1');
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return 403 with reason if successful but user not active', async () => {
    userAdapter.authenticate.mockReturnValue({
      sub: 'user1',
      status: 0,
    });

    await authenticate(req, res);

    expect(res.statusCode).toBe(403);
    expect(res._getData()).toMatchObject({
      reason_code: 'ACCOUNT_DEACTIVATED',
      reason_description: 'Account has been deactivated',
    });
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return 403 with reason if not successful', async () => {
    userAdapter.authenticate.mockReturnValue(null);

    await authenticate(req, res);

    expect(res.statusCode).toBe(403);
    expect(res._getData()).toMatchObject({
      reason_code: 'INVALID_CREDENTIALS',
      reason_description: 'Invalid username or password',
    });
    expect(res._isEndCalled()).toBe(true);
  });
});
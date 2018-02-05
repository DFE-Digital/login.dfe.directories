jest.mock('./../../src/app/user/adapter', () => {
  return {
    find: jest.fn(),
    update: jest.fn(),
  };
});

const { find, update } = require('./../../src/app/user/adapter');
const patchUser = require('./../../src/app/user/api/patchUser');
const httpMocks = require('node-mocks-http');

describe('When patching a user', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      header: () => 'correlation-id',
      params: {
        id: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      },
      body: {
        given_name: 'Jennifer',
        family_name: 'Potter',
      },
    };

    res = httpMocks.createResponse();

    find.mockReset();
    find.mockReturnValue({
      sub: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      given_name: 'Jenny',
      family_name: 'Weasley',
      email: 'jenny.weasley@dumbledores-army.test',
      password: 'some-hashed-data',
      salt: 'random-salt-value',
    });

    update.mockReset();
  });

  it('then it should get user from storage', async () => {
    await patchUser(req, res);

    expect(find.mock.calls).toHaveLength(1);
    expect(find.mock.calls[0][0]).toBe('9b543631-884c-4b39-86d5-311ad5fc6cce');
    expect(find.mock.calls[0][1]).toBe('correlation-id');
  });

  it('then it should send 404 if user not found', async () => {
    find.mockReturnValue(null);

    await patchUser(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should update user in storage with new details', async () => {
    await patchUser(req, res);

    expect(update.mock.calls).toHaveLength(1);
    expect(update.mock.calls[0][0]).toMatchObject({
      sub: '9b543631-884c-4b39-86d5-311ad5fc6cce',
      given_name: 'Jennifer',
      family_name: 'Potter',
      email: 'jenny.weasley@dumbledores-army.test',
      password: 'some-hashed-data',
      salt: 'random-salt-value',
    });
    expect(update.mock.calls[0][1]).toBe('correlation-id');
  });

  it('then it should send 400 with error message if body has unknown property', async () => {
    req.body.bad = 'value';

    await patchUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toBe('Unpatchable property bad. Allowed properties given_name,family_name,email');
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should send 400 with error message if body has unpatchable property', async () => {
    req.body.sub = 'value';

    await patchUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getData()).toBe('Unpatchable property sub. Allowed properties given_name,family_name,email');
    expect(res._isEndCalled()).toBe(true);
  });
});

jest.mock('./../../../src/app/devices/data', () => {
  return {
    getUserAssociatedToDevice: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');
const { getUserAssociatedToDevice } = require('./../../../src/app/devices/data');
const getDevice = require('./../../../src/app/devices/api/getDevice');

describe('When getting user associated with device', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        type: 'digipass',
        serial_number: '123456789',
      },
    };

    res = httpMocks.createResponse();

    getUserAssociatedToDevice.mockReset();
    getUserAssociatedToDevice.mockReturnValue('user-1');
  });

  it('then it should get associated user from store', async () => {
    await getDevice(req, res);

    expect(getUserAssociatedToDevice.mock.calls).toHaveLength(1);
    expect(getUserAssociatedToDevice.mock.calls[0][0]).toBe('digipass');
    expect(getUserAssociatedToDevice.mock.calls[0][1]).toBe('123456789');
  });

  it('then it should return associated user if found', async () => {
    await getDevice(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toMatchObject({
      associatedWith: {
        sub: 'user-1',
      },
    });
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return 404 if user not found', async () => {
    getUserAssociatedToDevice.mockReturnValue(null);

    await getDevice(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });
});

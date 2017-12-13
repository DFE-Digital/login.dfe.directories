jest.mock('./../../src/infrastructure/config', () => (
  {
    devices: {
      type: 'static',
    },
  }));
jest.mock('./../../src/infrastructure/logger', () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});
jest.mock('./../../src/app/user/devices');

const httpMocks = require('node-mocks-http');
const getDevices = require('./../../src/app/user/api/getDevices');

describe('when getting a list of devices for user', () => {
  let req;
  let res;
  let devices;

  beforeEach(() => {
    req = {
      params: {
        id: 'a516696c-168c-4680-8dfb-1512d6fc234c',
      },
    };

    res = httpMocks.createResponse();

    devices = require('./../../src/app/user/devices');
    devices.getUserDevices.mockReset();
    devices.getUserDevices.mockReturnValue([
      {
        type: 'digipass',
        serialNumber: '123456',
      },
    ]);
  });

  it('then it should get devices from user', async () => {
    await getDevices(req, res);

    expect(devices.getUserDevices.mock.calls).toHaveLength(1);
    expect(devices.getUserDevices.mock.calls[0][0]).toBe('a516696c-168c-4680-8dfb-1512d6fc234c');
  });

  it('then it should return a JSON response', async () => {
    await getDevices(req, res);

    expect(res._isJSON()).toBe(true);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return devices in body', async () => {
    await getDevices(req, res);

    const actual = JSON.parse(res._getData());
    expect(actual).toBeInstanceOf(Array);
    expect(actual).toHaveLength(1);
    expect(actual[0]).toMatchObject({
      type: 'digipass',
      serialNumber: '123456',
    });
  });

  it('then it should return blank array is devices result is null', async () => {
    devices.getUserDevices.mockReturnValue(null);

    await getDevices(req, res);

    const actual = JSON.parse(res._getData());
    expect(actual).toBeInstanceOf(Array);
    expect(actual).toHaveLength(0);
  });

  it('then it should return 500 if error occurs', async () => {
    devices.getUserDevices.mockImplementation(() => {
      throw new Error('nope');
    });

    await getDevices(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._isEndCalled()).toBe(true);
  })
});

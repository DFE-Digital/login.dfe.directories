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
jest.mock('uuid/v4');

const httpMocks = require('node-mocks-http');
const createDevice = require('./../../src/app/user/api/createDevice');

describe('when getting a list of devices for user', () => {
  let req;
  let res;
  let devices;
  const expectedRequestCorrelationId = '64b38e30-8eb4-4f95-8411-d1d22cebbf32';

  beforeEach(() => {
    req = {
      params: {
        id: 'a516696c-168c-4680-8dfb-1512d6fc234c',
      },
      body: {
        type: 'digipass',
        serialNumber: '987654',
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    res = httpMocks.createResponse();

    devices = require('./../../src/app/user/devices');
    devices.createUserDevices.mockReset();
    devices.getUserDevices.mockReset();
    devices.getUserDevices.mockReturnValue([
      {
        type: 'digipass',
        serialNumber: '123456',
      },
    ]);

    require('uuid/v4').mockReturnValue('b8107414-969c-46f4-b0fa-47d3e132e8e1');
  });

  it('then it should create device for user', async () => {
    await createDevice(req, res);

    expect(devices.createUserDevices.mock.calls).toHaveLength(1);
    expect(devices.createUserDevices.mock.calls[0][0]).toBe('a516696c-168c-4680-8dfb-1512d6fc234c');
    expect(devices.createUserDevices.mock.calls[0][1]).toMatchObject({
      id: 'b8107414-969c-46f4-b0fa-47d3e132e8e1',
      type: 'digipass',
      serialNumber: '987654',
    });
    expect(devices.createUserDevices.mock.calls[0][2]).toBe(expectedRequestCorrelationId);
  });

  it('then it should return a 202 response', async () => {
    await createDevice(req, res);

    expect(res.statusCode).toBe(202);
    expect(res._isJSON()).toBe(true);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return devices in body', async () => {
    await createDevice(req, res);

    expect(devices.getUserDevices.mock.calls).toHaveLength(1);
    expect(devices.getUserDevices.mock.calls[0][0]).toBe('a516696c-168c-4680-8dfb-1512d6fc234c');
    expect(devices.getUserDevices.mock.calls[0][1]).toBe(expectedRequestCorrelationId);

    const actual = JSON.parse(res._getData());
    expect(actual).toBeInstanceOf(Array);
    expect(actual).toHaveLength(1);
    expect(actual[0]).toMatchObject({
      type: 'digipass',
      serialNumber: '123456',
    });
  });

  it('then it should return 500 if error occurs', async () => {
    devices.createUserDevices.mockImplementation(() => {
      throw new Error('nope');
    });

    await createDevice(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return 400 if body missing type', async () => {
    req.body.type = undefined;

    await createDevice(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isEndCalled()).toBe(true);
    expect(res._isJSON()).toBe(true);
    expect(JSON.parse(res._getData())).toMatchObject({
      message: 'Must provide type',
    });
  });

  it('then it should return 400 if type is not valid', async () => {
    req.body.type = 'no-such-device';

    await createDevice(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isEndCalled()).toBe(true);
    expect(res._isJSON()).toBe(true);
    expect(JSON.parse(res._getData())).toMatchObject({
      message: 'Invalid type no-such-device. Valid options are digipass',
    });
  });

  it('then it should return 400 if body is missing serial number', async () => {
    req.body.serialNumber = undefined;

    await createDevice(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isEndCalled()).toBe(true);
    expect(res._isJSON()).toBe(true);
    expect(JSON.parse(res._getData())).toMatchObject({
      message: 'Must provide serialNumber',
    });
  });
});

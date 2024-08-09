const httpMocks = require('node-mocks-http');
const linkDsiUserWithEntra = require('../../src/app/user/api/linkDsiUserWithEntraHandler');
const adaptor = require('../../src/app/user/adapter');

const fakeUser = {
  sub: '78071717-4247-480d-90a3-3d531379ebf8',
  family_name: 'f-anme',
  given_name: 'g-name',
  is_entra: false,
  entra_oid: null,
  entra_linked: null,
};

jest.mock('./../../src/app/user/adapter', () => ({
  linkUserWithEntraOid: jest.fn().mockReturnValue(fakeUser),
}));

jest.mock('./../../src/infrastructure/config', () => ({
}));

jest.mock('../../src/infrastructure/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('When calling the linkDsiUserWithEntra endpoint', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        uid: undefined,
        entraOid: undefined,
      },
      header: jest.fn().mockReturnValue('correlation-id'),
    };
    res = httpMocks.createResponse();
  });

  it('should return a 404 if the uid and entraOid parameters are missing', async () => {
    await linkDsiUserWithEntra(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('should return a 404 if the uid is provided by entraOid is missing', async () => {
    req.params.uid = '1234';

    await linkDsiUserWithEntra(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('should return a 404 if the uid is not provided but entraOid has', async () => {
    req.params.entraOid = '1234';

    await linkDsiUserWithEntra(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('should return a 404 if the uid in not a uuid', async () => {
    req.params.entraOid = '78071717-4247-480d-90a3-3d531379ebf8';
    req.params.uid = '1234';

    await linkDsiUserWithEntra(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('should return a 404 if the entraOid in not a uuid', async () => {
    req.params.entraOid = '1234';
    req.params.uid = '78071717-4247-480d-90a3-3d531379ebf8';

    await linkDsiUserWithEntra(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('should return the fakeuser', async () => {
    req.params.entraOid = '78071717-4247-480d-90a3-3d531379ebf8';
    req.params.uid = '78071717-4247-480d-90a3-3d531379ebf8';

    await linkDsiUserWithEntra(req, res);
    expect(res.statusCode).toBe(200);
    // eslint-disable-next-line no-underscore-dangle
    expect(res._getData()).toMatchObject({
      sub: '78071717-4247-480d-90a3-3d531379ebf8',
      entraOid: null,
      family_name: 'f-anme',
      given_name: 'g-name',
      isEntra: false,
    });
  });

  it('should return 404 if linkUserWithEntraOid returns null', async () => {
    req.params.entraOid = '78071717-4247-480d-90a3-3d531379ebf8';
    req.params.uid = '78071717-4247-480d-90a3-3d531379ebf8';

    adaptor.linkUserWithEntraOid.mockReturnValue(undefined);

    await linkDsiUserWithEntra(req, res);
    expect(res.statusCode).toBe(404);
  });
});

jest.mock('./../../src/app/user/adapter', () => {
  return {
    list: jest.fn(),
  };
});
jest.mock('./../../src/infrastructure/logger', () => {
  return {
  };
});

const adapter = require('./../../src/app/user/adapter');
const listActon = require('./../../src/app/user/api/list');

describe('when listing users in response to an api request', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      query: {
        page: 2,
      },
    };

    res = {
      status: jest.fn(),
      contentType: jest.fn(),
      send: jest.fn(),
    };
    res.status.mockReturnValue(res);
    res.contentType.mockReturnValue(res);
    res.send.mockReturnValue(res);

    adapter.list.mockReset();
    adapter.list.mockReturnValue({
      users: [
        {
          sub: '963a0a68-aa60-11e7-abc4-cec278b6b50a',
          given_name: 'Test',
          family_name: 'Tester',
          email: 'test@localuser.com',
          password: '0dqy81MVA9lqs2+xinvOXbbGMhd18X4pq5aRfiE65pIKxcWB0OtAffY9NdJy0/ksjhBG9EOYywti2WYmtqwxypRil+x0/nBeBlJUfN7/Q9l8tRiDcqq8NghC8wqSEuyzLKXoE/+VDPkW35Vo8czsOp5PT0xN3IQ31vlld/4PqsqQWYE4WBTBO/PO6SoAfNapDxb4M9C8TiReek43pfVL3wTst8Bv4wkeFcLy7NMGVyM48LmjlyvYPIY5NTz8RGOSCAyB7kIxYEsf9SB0Sp0IMGhHIoM8/Yhso3cJNTKTLod0Uz3Htc0JAStugt6RCrnar3Yc7yUzSGDNZcvM31HsP74i5TifaJiavHOiZxjaHYn/KsLFi5/zqNRcYkzN+dYzWY1hjCSY47za9HMh89ZHxGkmrknQY4YKRp/uvg2driXwZDaIm7NUt90mXim4PGM0kYejp9SUwlIGmc5F4QO5F3tBoRb/AYsf3f6mDw7SXAMnO/OVfglvf/x3ICE7UCLkuMXZAECe8MJoJnpP+LVrNQfJjSrjmBYrVRVkS2QFrte0g2WO1SprE9KH8kkmNEmkC6Z3orDczx5jW7LSl37ZHzq1dvMYAJrEoWH21e6ug5usMSl1X6S5uBIsSrj8kOlTYgr4huPjN54aBTVYazCn6UFVrt83E81nbuyZTadrnA4=',
          salt: 'PasswordIs-password-',
        },
      ],
      numberOfPages: 22,
    });

  });

  it('then it should get page of users using page number specified', async () => {
    await listActon(req, res);

    expect(adapter.list.mock.calls).toHaveLength(1);
    expect(adapter.list.mock.calls[0][0]).toBe(2);
  });

  it('then it should get first page of users if page number not specified', async () => {
    req.query.page = undefined;

    await listActon(req, res);

    expect(adapter.list.mock.calls).toHaveLength(1);
    expect(adapter.list.mock.calls[0][0]).toBe(1);
  });

  it('then it should return 400 if page number if not numeric', async () => {
    req.query.page = 'not-a-number';

    await listActon(req, res);

    expect(adapter.list.mock.calls).toHaveLength(0);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.send.mock.calls).toHaveLength(1);
  });

  it('then it should return 400 if page number is less than 1', async () => {
    req.query.page = 0;

    await listActon(req, res);

    expect(adapter.list.mock.calls).toHaveLength(0);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.send.mock.calls).toHaveLength(1);
  });

  it('then it should use a page size of 25 when listing users', async () => {
    req.query.page = undefined;

    await listActon(req, res);

    expect(adapter.list.mock.calls).toHaveLength(1);
    expect(adapter.list.mock.calls[0][1]).toBe(25);
  });

  it('then it should return page of users', async () => {
    await listActon(req, res);

    expect(res.contentType.mock.calls).toHaveLength(1);
    expect(res.contentType.mock.calls[0][0]).toBe('json');
    expect(res.send.mock.calls).toHaveLength(1);
    expect(res.send.mock.calls[0][0]).toBe(JSON.stringify({
      users: [{
        sub: '963a0a68-aa60-11e7-abc4-cec278b6b50a',
        given_name: 'Test',
        family_name: 'Tester',
        email: 'test@localuser.com',
      }],
      numberOfPages: 22,
    }));
  });
});
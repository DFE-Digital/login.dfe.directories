jest.mock('./../../src/infrastructure/config', () => (
  {
    devices: {
      type: 'static',
    },
  }));
jest.mock('./../../src/app/user/adapter', () => {
  return {
    list: jest.fn(),
    getLegacyUsernames: jest.fn(),
  };
});
jest.mock('./../../src/app/user/devices');
jest.mock('./../../src/infrastructure/logger', () => {
  return {
    error: console.error,
  };
});

const adapter = require('./../../src/app/user/adapter');
const { getUserDevices } = require('./../../src/app/user/devices');
const listActon = require('./../../src/app/user/api/list');

describe('when listing users in response to an api request', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      query: {
        page: 2,
      },
      header: jest.fn().mockReturnValue('some-correlation-id'),
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

    adapter.getLegacyUsernames.mockReset();
    adapter.getLegacyUsernames.mockReturnValue([]);

    getUserDevices.mockReset().mockReturnValue([
      {
        type: 'digipass',
        serialNumber: '123456',
      },
    ]);
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

  it('then it should not attempt to get devices if include is not specified', async () => {
    await listActon(req, res);

    expect(getUserDevices.mock.calls).toHaveLength(0);
  });

  it('then it should not attempt to get devices if include does not contain devices', async () => {
    req.query.include = 'field1,field2';

    await listActon(req, res);

    expect(getUserDevices.mock.calls).toHaveLength(0);
  });

  it('then it should get and return devices for users when include contains devices', async () => {
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
        {
          sub: '7ef008ae-966d-46c9-ae11-389f5f7b4222',
          given_name: 'Fred',
          family_name: 'Fixer',
          email: 'fred.fixer@unit.tests',
          password: '0dqy81MVA9lqs2+xinvOXbbGMhd18X4pq5aRfiE65pIKxcWB0OtAffY9NdJy0/ksjhBG9EOYywti2WYmtqwxypRil+x0/nBeBlJUfN7/Q9l8tRiDcqq8NghC8wqSEuyzLKXoE/+VDPkW35Vo8czsOp5PT0xN3IQ31vlld/4PqsqQWYE4WBTBO/PO6SoAfNapDxb4M9C8TiReek43pfVL3wTst8Bv4wkeFcLy7NMGVyM48LmjlyvYPIY5NTz8RGOSCAyB7kIxYEsf9SB0Sp0IMGhHIoM8/Yhso3cJNTKTLod0Uz3Htc0JAStugt6RCrnar3Yc7yUzSGDNZcvM31HsP74i5TifaJiavHOiZxjaHYn/KsLFi5/zqNRcYkzN+dYzWY1hjCSY47za9HMh89ZHxGkmrknQY4YKRp/uvg2driXwZDaIm7NUt90mXim4PGM0kYejp9SUwlIGmc5F4QO5F3tBoRb/AYsf3f6mDw7SXAMnO/OVfglvf/x3ICE7UCLkuMXZAECe8MJoJnpP+LVrNQfJjSrjmBYrVRVkS2QFrte0g2WO1SprE9KH8kkmNEmkC6Z3orDczx5jW7LSl37ZHzq1dvMYAJrEoWH21e6ug5usMSl1X6S5uBIsSrj8kOlTYgr4huPjN54aBTVYazCn6UFVrt83E81nbuyZTadrnA4=',
          salt: 'PasswordIs-password-',
        },
      ],
      numberOfPages: 22,
    });
    req.query.include = 'field1,devices,field2';
    getUserDevices.mockImplementation((uid) => {
      let serialNumber = '1234567';
      if (uid === '963a0a68-aa60-11e7-abc4-cec278b6b50a') {
        serialNumber = '1111111';
      }
      if (uid === '7ef008ae-966d-46c9-ae11-389f5f7b4222') {
        serialNumber = '2222222';
      }
      return [
        {
          type: 'digipass',
          serialNumber,
        },
      ];
    });

    await listActon(req, res);

    expect(getUserDevices.mock.calls).toHaveLength(2);
    expect(getUserDevices.mock.calls[0][0]).toBe('963a0a68-aa60-11e7-abc4-cec278b6b50a');
    expect(getUserDevices.mock.calls[1][0]).toBe('7ef008ae-966d-46c9-ae11-389f5f7b4222');

    const actual = JSON.parse(res.send.mock.calls[0][0]);
    expect(actual.users[0].devices).toHaveLength(1);
    expect(actual.users[0].devices[0]).toEqual({
      type: 'digipass',
      serialNumber: '1111111',
    });
    expect(actual.users[1].devices).toHaveLength(1);
    expect(actual.users[1].devices[0]).toEqual({
      type: 'digipass',
      serialNumber: '2222222',
    });
  });


  it('then it should not attempt to get legacy usernames if include is not specified', async () => {
    await listActon(req, res);

    expect(adapter.getLegacyUsernames.mock.calls).toHaveLength(0);
  });

  it('then it should not attempt to get legacy usernames if include does not contain devices', async () => {
    req.query.include = 'field1,field2';

    await listActon(req, res);

    expect(adapter.getLegacyUsernames.mock.calls).toHaveLength(0);
  });

  it('then it should get and return legacy usernames for users when include contains legacyusernames', async () => {
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
        {
          sub: '7ef008ae-966d-46c9-ae11-389f5f7b4222',
          given_name: 'Fred',
          family_name: 'Fixer',
          email: 'fred.fixer@unit.tests',
          password: '0dqy81MVA9lqs2+xinvOXbbGMhd18X4pq5aRfiE65pIKxcWB0OtAffY9NdJy0/ksjhBG9EOYywti2WYmtqwxypRil+x0/nBeBlJUfN7/Q9l8tRiDcqq8NghC8wqSEuyzLKXoE/+VDPkW35Vo8czsOp5PT0xN3IQ31vlld/4PqsqQWYE4WBTBO/PO6SoAfNapDxb4M9C8TiReek43pfVL3wTst8Bv4wkeFcLy7NMGVyM48LmjlyvYPIY5NTz8RGOSCAyB7kIxYEsf9SB0Sp0IMGhHIoM8/Yhso3cJNTKTLod0Uz3Htc0JAStugt6RCrnar3Yc7yUzSGDNZcvM31HsP74i5TifaJiavHOiZxjaHYn/KsLFi5/zqNRcYkzN+dYzWY1hjCSY47za9HMh89ZHxGkmrknQY4YKRp/uvg2driXwZDaIm7NUt90mXim4PGM0kYejp9SUwlIGmc5F4QO5F3tBoRb/AYsf3f6mDw7SXAMnO/OVfglvf/x3ICE7UCLkuMXZAECe8MJoJnpP+LVrNQfJjSrjmBYrVRVkS2QFrte0g2WO1SprE9KH8kkmNEmkC6Z3orDczx5jW7LSl37ZHzq1dvMYAJrEoWH21e6ug5usMSl1X6S5uBIsSrj8kOlTYgr4huPjN54aBTVYazCn6UFVrt83E81nbuyZTadrnA4=',
          salt: 'PasswordIs-password-',
        },
        {
          sub: '17f79740-2ecf-4831-b05e-95b85f0b26ae',
          given_name: 'Fran',
          family_name: 'Finder',
          email: 'fran.finder@unit.tests',
          password: '0dqy81MVA9lqs2+xinvOXbbGMhd18X4pq5aRfiE65pIKxcWB0OtAffY9NdJy0/ksjhBG9EOYywti2WYmtqwxypRil+x0/nBeBlJUfN7/Q9l8tRiDcqq8NghC8wqSEuyzLKXoE/+VDPkW35Vo8czsOp5PT0xN3IQ31vlld/4PqsqQWYE4WBTBO/PO6SoAfNapDxb4M9C8TiReek43pfVL3wTst8Bv4wkeFcLy7NMGVyM48LmjlyvYPIY5NTz8RGOSCAyB7kIxYEsf9SB0Sp0IMGhHIoM8/Yhso3cJNTKTLod0Uz3Htc0JAStugt6RCrnar3Yc7yUzSGDNZcvM31HsP74i5TifaJiavHOiZxjaHYn/KsLFi5/zqNRcYkzN+dYzWY1hjCSY47za9HMh89ZHxGkmrknQY4YKRp/uvg2driXwZDaIm7NUt90mXim4PGM0kYejp9SUwlIGmc5F4QO5F3tBoRb/AYsf3f6mDw7SXAMnO/OVfglvf/x3ICE7UCLkuMXZAECe8MJoJnpP+LVrNQfJjSrjmBYrVRVkS2QFrte0g2WO1SprE9KH8kkmNEmkC6Z3orDczx5jW7LSl37ZHzq1dvMYAJrEoWH21e6ug5usMSl1X6S5uBIsSrj8kOlTYgr4huPjN54aBTVYazCn6UFVrt83E81nbuyZTadrnA4=',
          salt: 'PasswordIs-password-',
        },
      ],
      numberOfPages: 22,
    });
    req.query.include = 'field1,legacyusernames,field2';
    adapter.getLegacyUsernames.mockReturnValue([
      { uid: '963a0a68-aa60-11e7-abc4-cec278b6b50a', legacy_username: 'ttester1' },
      { uid: '963a0a68-aa60-11e7-abc4-cec278b6b50a', legacy_username: 'ttester2' },
      { uid: '17f79740-2ecf-4831-b05e-95b85f0b26ae', legacy_username: 'franf1' },
    ]);

    await listActon(req, res);

    expect(adapter.getLegacyUsernames.mock.calls).toHaveLength(1);
    expect(adapter.getLegacyUsernames.mock.calls[0][0]).toEqual(['963a0a68-aa60-11e7-abc4-cec278b6b50a', '7ef008ae-966d-46c9-ae11-389f5f7b4222', '17f79740-2ecf-4831-b05e-95b85f0b26ae']);

    const actual = JSON.parse(res.send.mock.calls[0][0]);
    expect(actual.users[0].legacyUsernames).toBeDefined();
    expect(actual.users[0].legacyUsernames).toHaveLength(2);
    expect(actual.users[0].legacyUsernames[0]).toBe('ttester1');
    expect(actual.users[0].legacyUsernames[1]).toBe('ttester2');

    expect(actual.users[1].legacyUsernames).toBeUndefined();

    expect(actual.users[2].legacyUsernames).toBeDefined();
    expect(actual.users[2].legacyUsernames).toHaveLength(1);
    expect(actual.users[2].legacyUsernames[0]).toBe('franf1');
  });
});
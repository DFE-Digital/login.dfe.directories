jest.mock('./../../src/app/user/adapter', () => ({
  getLegacyUsernames: jest.fn(),
}));

const { isUuid } = require('../../src/app/user/api/helpers');

describe('When calling isUuid', () => {
  it('should return false when given 123', async () => {
    expect(isUuid('123')).toBe(false);
  });

  it('should return false when given 78071717-4247-480d-90a3-', async () => {
    expect(isUuid('78071717-4247-480d-90a3-')).toBe(false);
  });

  it('should return true when given a valid Uuid-4', async () => {
    expect(isUuid('78071717-4247-480d-90a3-3d531379ebf8')).toBe(true);
  });

  it('should return true when given a valid Uuid-7', async () => {
    expect(isUuid('019132b6-c295-7690-aaaa-0febf6decd56')).toBe(true);
  });
});

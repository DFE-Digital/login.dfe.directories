jest.mock("./../../src/app/user/adapter", () => ({
  getLegacyUsernames: jest.fn(),
}));

const { isUuid, isValidDate } = require("../../src/app/user/api/helpers");

describe("When calling isUuid", () => {
  it("should return false when given 123", async () => {
    expect(isUuid("123")).toBe(false);
  });

  it("should return false when an incorrect Uuid", async () => {
    expect(isUuid("78071717-4247-480d-90a3-")).toBe(false);
  });

  it("should return true when given a valid lowercase Uuid-4", async () => {
    expect(isUuid("78071717-4247-480d-90a3-3d531379ebf8")).toBe(true);
  });

  it("should return true when given a valid lowercase Uuid-7", async () => {
    expect(isUuid("019132b6-c295-7690-aaaa-0febf6decd56")).toBe(true);
  });

  it("should return true when given a valid uppercase Uuid-7", async () => {
    expect(isUuid("019132B6-C295-7690-AAAA-0FEBF6DECD56")).toBe(true);
  });

  it("should return true when given a valid uppercase Uuid-4", async () => {
    expect(isUuid("78071717-4247-480D-90A3-3D531379EBF8")).toBe(true);
  });
});

describe("When calling isValidDate function", () => {
  it("returns true for valid ISO 8601 date string with time and optional milliseconds", () => {
    expect(isValidDate("2025-02-07T14:30:00Z")).toBe(true);
    expect(isValidDate("2025-02-07T14:30:00.000Z")).toBe(true);
  });

  it("returns false for an ISO date string with an invalid date component", () => {
    expect(isValidDate("2021-02-31T00:00:00Z")).toBe(false);
  });

  it("returns true for date-only format", () => {
    expect(isValidDate("2025-02-07")).toBe(true);
  });

  it("returns false for completely invalid date strings", () => {
    expect(isValidDate("not-a-date")).toBe(false);
    expect(isValidDate("Feb 7, 2025")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidDate("")).toBe(false);
  });

  it("returns false for non-string inputs", () => {
    expect(isValidDate(1234567890)).toBe(false);
    expect(isValidDate(null)).toBe(false);
    expect(isValidDate(undefined)).toBe(false);
    expect(isValidDate({})).toBe(false);
  });
});

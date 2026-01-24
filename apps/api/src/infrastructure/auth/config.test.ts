import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { getConfig } from "./config";

describe("Auth Config", () => {
  // Save original env
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear relevant env vars before each test
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    delete process.env.JWT_REFRESH_EXPIRES_IN;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  it("should return configuration when all environment variables are set", () => {
    process.env.JWT_ACCESS_SECRET = "access-secret";
    process.env.JWT_REFRESH_SECRET = "refresh-secret";
    process.env.JWT_ACCESS_EXPIRES_IN = "30m";
    process.env.JWT_REFRESH_EXPIRES_IN = "14d";

    const config = getConfig();

    expect(config).toEqual({
      accessSecret: "access-secret",
      refreshSecret: "refresh-secret",
      accessExpiresIn: "30m",
      refreshExpiresIn: "14d",
    });
  });

  it("should return default values for expiration times when not set", () => {
    process.env.JWT_ACCESS_SECRET = "access-secret";
    process.env.JWT_REFRESH_SECRET = "refresh-secret";

    const config = getConfig();

    expect(config.accessExpiresIn).toBe("15m");
    expect(config.refreshExpiresIn).toBe("7d");
  });

  it("should throw error when JWT_ACCESS_SECRET is missing", () => {
    process.env.JWT_REFRESH_SECRET = "refresh-secret";

    expect(() => getConfig()).toThrow("JWT secrets are not configured");
  });

  it("should throw error when JWT_REFRESH_SECRET is missing", () => {
    process.env.JWT_ACCESS_SECRET = "access-secret";

    expect(() => getConfig()).toThrow("JWT secrets are not configured");
  });

  it("should throw error when both secrets are missing", () => {
    expect(() => getConfig()).toThrow("JWT secrets are not configured");
  });
});

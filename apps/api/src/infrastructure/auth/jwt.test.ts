import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "./jwt";

describe("JWT Infrastructure", () => {
  // Save original env
  const originalAccessSecret = process.env.JWT_ACCESS_SECRET;
  const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;
  const originalAccessExpires = process.env.JWT_ACCESS_EXPIRES_IN;
  const originalRefreshExpires = process.env.JWT_REFRESH_EXPIRES_IN;

  const testPayload = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    process.env.JWT_ACCESS_EXPIRES_IN = "15m";
    process.env.JWT_REFRESH_EXPIRES_IN = "7d";
  });

  afterEach(() => {
    // Restore env
    if (originalAccessSecret) process.env.JWT_ACCESS_SECRET = originalAccessSecret;
    else delete process.env.JWT_ACCESS_SECRET;
    if (originalRefreshSecret) process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
    else delete process.env.JWT_REFRESH_SECRET;
    if (originalAccessExpires) process.env.JWT_ACCESS_EXPIRES_IN = originalAccessExpires;
    else delete process.env.JWT_ACCESS_EXPIRES_IN;
    if (originalRefreshExpires) process.env.JWT_REFRESH_EXPIRES_IN = originalRefreshExpires;
    else delete process.env.JWT_REFRESH_EXPIRES_IN;
  });

  describe("generateAccessToken", () => {
    it("should generate a valid access token", () => {
      const token = generateAccessToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    it("should throw error if access secret is missing", () => {
      delete process.env.JWT_ACCESS_SECRET;
      expect(() => generateAccessToken(testPayload)).toThrow("JWT secrets are not configured");
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a valid refresh token", () => {
      const token = generateRefreshToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });
  });

  describe("verifyAccessToken", () => {
    it("should throw error for invalid token", () => {
      expect(() => verifyAccessToken("invalid-token")).toThrow();
    });

    it("should throw error for token signed with different secret", () => {
      const token = generateRefreshToken(testPayload); // Signed with refresh secret
      expect(() => verifyAccessToken(token)).toThrow();
    });
  });
});

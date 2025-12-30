import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "./jwt";

describe("JWT Infrastructure", () => {
  const originalEnv = process.env;
  const testPayload = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "access-secret";
    process.env.JWT_REFRESH_SECRET = "refresh-secret";
    process.env.JWT_ACCESS_EXPIRES_IN = "15m";
    process.env.JWT_REFRESH_EXPIRES_IN = "7d";
  });

  afterEach(() => {
    process.env = originalEnv;
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

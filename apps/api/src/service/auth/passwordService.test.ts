import { describe, it, expect, beforeEach } from "bun:test";
import { PasswordService } from "./passwordService";

describe("PasswordService", () => {
  let passwordService: PasswordService;
  const testPassword = "test-password";
  let hashedPassword: string;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe("hashPassword", () => {
    it("should hash a password", async () => {
      // Act
      hashedPassword = await passwordService.hashPassword(testPassword);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(testPassword);
      expect(hashedPassword.length).toBeGreaterThan(10); // bcrypt hash has a specific format
    });
  });

  describe("verifyPassword", () => {
    beforeEach(async () => {
      // Ensure we have a hashed password for verification tests
      hashedPassword = await passwordService.hashPassword(testPassword);
    });

    it("should verify a correct password", async () => {
      // Act
      const isValid = await passwordService.verifyPassword(testPassword, hashedPassword);

      // Assert
      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      // Act
      const isValid = await passwordService.verifyPassword("wrong-password", hashedPassword);

      // Assert
      expect(isValid).toBe(false);
    });

    it("should handle empty password", async () => {
      // Act
      const isValid = await passwordService.verifyPassword("", hashedPassword);

      // Assert
      expect(isValid).toBe(false);
    });

    it("should handle empty hash", async () => {
      // Act
      const isValid = await passwordService.verifyPassword(testPassword, "");

      // Assert
      expect(isValid).toBe(false);
    });
  });
});

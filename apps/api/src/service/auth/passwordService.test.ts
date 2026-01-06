import { describe, it, expect, beforeEach, mock } from "bun:test";
import { PasswordService } from "./passwordService";

// bcryptjs をモック化
const mockHash = mock(async () => "hashed-password");
const mockCompare = mock(async () => true);

mock.module("bcryptjs", () => ({
  hash: mockHash,
  compare: mockCompare,
}));

describe("PasswordService", () => {
  let passwordService: PasswordService;
  const testPassword = "test-password";

  beforeEach(() => {
    passwordService = new PasswordService();
    mockHash.mockClear();
    mockCompare.mockClear();
  });

  describe("hashPassword", () => {
    it("should call bcrypt.hash with correct arguments", async () => {
      const result = await passwordService.hashPassword(testPassword);

      expect(result).toBe("hashed-password");
      // 第2引数の salt rounds が 10 であることを検証
      expect(mockHash).toHaveBeenCalledWith(testPassword, 10);
    });
  });

  describe("verifyPassword", () => {
    it("should call bcrypt.compare with correct arguments", async () => {
      const hashedPassword = "stored-hash";
      const result = await passwordService.verifyPassword(testPassword, hashedPassword);

      expect(result).toBe(true);
      expect(mockCompare).toHaveBeenCalledWith(testPassword, hashedPassword);
    });

    it("should return false when bcrypt.compare returns false", async () => {
      mockCompare.mockImplementation(async () => false);
      const result = await passwordService.verifyPassword("wrong-password", "some-hash");

      expect(result).toBe(false);
    });
  });
});

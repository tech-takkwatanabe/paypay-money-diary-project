import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { TokenService, type TokenPayload } from "./tokenService";
import * as jwt from "@/infrastructure/auth/jwt";

// Store original implementations
const originalJwt = { ...jwt };

// Mock the JWT functions
const mockGenerateAccessToken = mock(() => "mock-access-token");
const mockGenerateRefreshToken = mock(() => "mock-refresh-token");
const mockVerifyRefreshToken = mock(() => ({
  userId: "user-123",
  email: "test@example.com",
}));

describe("TokenService", () => {
  let tokenService: TokenService;
  const mockPayload: TokenPayload = {
    userId: "user-123",
    email: "test@example.com",
  };

  beforeEach(() => {
    // Setup mocks before each test
    mock.module("@/infrastructure/auth/jwt", () => ({
      generateAccessToken: mockGenerateAccessToken,
      generateRefreshToken: mockGenerateRefreshToken,
      verifyRefreshToken: mockVerifyRefreshToken,
    }));

    tokenService = new TokenService();
    mockGenerateAccessToken.mockClear();
    mockGenerateRefreshToken.mockClear();
    mockVerifyRefreshToken.mockClear();
  });

  afterEach(() => {
    // Restore original implementations after each test
    mock.module("@/infrastructure/auth/jwt", () => originalJwt);
  });

  describe("generateTokenPair", () => {
    it("should generate both access and refresh tokens", () => {
      // Arrange
      const mockAccessToken = "mock-access-token";
      const mockRefreshToken = "mock-refresh-token";

      mockGenerateAccessToken.mockReturnValue(mockAccessToken);
      mockGenerateRefreshToken.mockReturnValue(mockRefreshToken);

      // Act
      const result = tokenService.generateTokenPair(mockPayload);

      // Assert
      expect(mockGenerateAccessToken).toHaveBeenCalledWith(mockPayload);
      expect(mockGenerateRefreshToken).toHaveBeenCalledWith(mockPayload);
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });
  });

  describe("generateAccessToken", () => {
    it("should generate an access token", () => {
      // Arrange
      const mockToken = "mock-access-token";
      mockGenerateAccessToken.mockReturnValue(mockToken);

      // Act
      const result = tokenService.generateAccessToken(mockPayload);

      // Assert
      expect(mockGenerateAccessToken).toHaveBeenCalledWith(mockPayload);
      expect(result).toBe(mockToken);
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify a refresh token", () => {
      // Arrange
      const mockToken = "mock-refresh-token";
      mockVerifyRefreshToken.mockReturnValue(mockPayload);

      // Act
      const result = tokenService.verifyRefreshToken(mockToken);

      // Assert
      expect(mockVerifyRefreshToken).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockPayload);
    });

    it("should throw an error if token verification fails", () => {
      // Arrange
      const mockToken = "invalid-token";
      const error = new Error("Invalid token");
      mockVerifyRefreshToken.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      expect(() => tokenService.verifyRefreshToken(mockToken)).toThrow(error);
      expect(mockVerifyRefreshToken).toHaveBeenCalledWith(mockToken);
    });
  });
});

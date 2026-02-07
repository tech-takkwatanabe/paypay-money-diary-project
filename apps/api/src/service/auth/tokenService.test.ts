import { describe, it, expect, beforeEach, mock } from "bun:test";
import { TokenService } from "./tokenService";
import { type TokenPayload } from "@/types/token";
import * as jwt from "@/infrastructure/auth/jwt";

describe("TokenService", () => {
  let tokenService: TokenService;
  const mockPayload: TokenPayload = {
    userId: "user-123",
    email: "test@example.com",
  };

  const mockGenerateAccessToken = mock((_payload: TokenPayload) => "mock-access-token");
  const mockGenerateRefreshToken = mock((_payload: TokenPayload) => "mock-refresh-token");
  const mockVerifyRefreshToken = mock((_token: string) => ({
    userId: "user-123",
    email: "test@example.com",
  }));

  const mockJwtProvider = {
    ...jwt,
    generateAccessToken: mockGenerateAccessToken,
    generateRefreshToken: mockGenerateRefreshToken,
    verifyRefreshToken: mockVerifyRefreshToken,
  };

  beforeEach(() => {
    tokenService = new TokenService(mockJwtProvider as unknown as typeof jwt);
    mockGenerateAccessToken.mockClear();
    mockGenerateRefreshToken.mockClear();
    mockVerifyRefreshToken.mockClear();

    // Reset default implementations
    mockGenerateAccessToken.mockReturnValue("mock-access-token");
    mockGenerateRefreshToken.mockReturnValue("mock-refresh-token");
    mockVerifyRefreshToken.mockReturnValue({
      userId: "user-123",
      email: "test@example.com",
    });
  });

  describe("generateTokenPair", () => {
    it("should generate both access and refresh tokens", () => {
      // Arrange
      const mockAccessToken = "custom-access-token";
      const mockRefreshToken = "custom-refresh-token";

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
      const mockToken = "custom-access-token";
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

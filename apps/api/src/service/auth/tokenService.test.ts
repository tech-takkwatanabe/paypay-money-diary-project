import { describe, it, expect, beforeEach, mock, type Mock } from "bun:test";
import { TokenService, type TokenPayload } from "./tokenService";

// Mock the JWT functions at the module level
const mockGenerateAccessToken = mock((_payload: TokenPayload) => "mock-access-token");
const mockGenerateRefreshToken = mock((_payload: TokenPayload) => "mock-refresh-token");
const mockVerifyRefreshToken = mock((_token: string) => ({
  userId: "user-123",
  email: "test@example.com",
}));

mock.module("@/infrastructure/auth/jwt", () => ({
  generateAccessToken: mockGenerateAccessToken,
  generateRefreshToken: mockGenerateRefreshToken,
  verifyRefreshToken: mockVerifyRefreshToken,
}));

describe("TokenService", () => {
  let tokenService: TokenService;
  const mockPayload: TokenPayload = {
    userId: "user-123",
    email: "test@example.com",
  };

  const typedMockGenerateAccessToken = mockGenerateAccessToken as Mock<(payload: TokenPayload) => string>;
  const typedMockGenerateRefreshToken = mockGenerateRefreshToken as Mock<(payload: TokenPayload) => string>;
  const typedMockVerifyRefreshToken = mockVerifyRefreshToken as Mock<(token: string) => TokenPayload>;

  beforeEach(() => {
    tokenService = new TokenService();
    typedMockGenerateAccessToken.mockClear();
    typedMockGenerateRefreshToken.mockClear();
    typedMockVerifyRefreshToken.mockClear();

    // Reset default implementations
    typedMockGenerateAccessToken.mockReturnValue("mock-access-token");
    typedMockGenerateRefreshToken.mockReturnValue("mock-refresh-token");
    typedMockVerifyRefreshToken.mockReturnValue({
      userId: "user-123",
      email: "test@example.com",
    });
  });

  describe("generateTokenPair", () => {
    it("should generate both access and refresh tokens", () => {
      // Arrange
      const mockAccessToken = "custom-access-token";
      const mockRefreshToken = "custom-refresh-token";

      typedMockGenerateAccessToken.mockReturnValue(mockAccessToken);
      typedMockGenerateRefreshToken.mockReturnValue(mockRefreshToken);

      // Act
      const result = tokenService.generateTokenPair(mockPayload);

      // Assert
      expect(typedMockGenerateAccessToken).toHaveBeenCalledWith(mockPayload);
      expect(typedMockGenerateRefreshToken).toHaveBeenCalledWith(mockPayload);
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
      typedMockGenerateAccessToken.mockReturnValue(mockToken);

      // Act
      const result = tokenService.generateAccessToken(mockPayload);

      // Assert
      expect(typedMockGenerateAccessToken).toHaveBeenCalledWith(mockPayload);
      expect(result).toBe(mockToken);
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify a refresh token", () => {
      // Arrange
      const mockToken = "mock-refresh-token";
      typedMockVerifyRefreshToken.mockReturnValue(mockPayload);

      // Act
      const result = tokenService.verifyRefreshToken(mockToken);

      // Assert
      expect(typedMockVerifyRefreshToken).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockPayload);
    });

    it("should throw an error if token verification fails", () => {
      // Arrange
      const mockToken = "invalid-token";
      const error = new Error("Invalid token");
      typedMockVerifyRefreshToken.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      expect(() => tokenService.verifyRefreshToken(mockToken)).toThrow(error);
      expect(typedMockVerifyRefreshToken).toHaveBeenCalledWith(mockToken);
    });
  });
});

import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { IUserRepository } from "@/domain/repository/userRepository";
import { ITokenRepository } from "@/domain/repository/tokenRepository";

// Mock dependencies
const mockVerifyRefreshToken = mock(() => ({
  userId: "uuid-123",
  email: "test@example.com",
}));
const mockGenerateAccessToken = mock(() => "new_access_token");
const mockGenerateRefreshToken = mock(() => "new_refresh_token");

mock.module("@/infrastructure/auth/jwt", () => ({
  verifyRefreshToken: mockVerifyRefreshToken,
  generateAccessToken: mockGenerateAccessToken,
  generateRefreshToken: mockGenerateRefreshToken,
}));

// Import RefreshUseCase AFTER mocking modules
import { RefreshUseCase } from "./refreshUseCase";

// Mock IUserRepository
const mockFindByEmail = mock();
const mockFindById = mock();
const mockCreate = mock();

const mockUserRepository: IUserRepository = {
  findByEmail: mockFindByEmail as IUserRepository["findByEmail"],
  findById: mockFindById as IUserRepository["findById"],
  create: mockCreate as IUserRepository["create"],
};

// Mock ITokenRepository
const mockSaveRefreshToken = mock();
const mockFindRefreshToken = mock();
const mockDeleteRefreshToken = mock();

const mockTokenRepository: ITokenRepository = {
  saveRefreshToken:
    mockSaveRefreshToken as ITokenRepository["saveRefreshToken"],
  findRefreshToken:
    mockFindRefreshToken as ITokenRepository["findRefreshToken"],
  deleteRefreshToken:
    mockDeleteRefreshToken as ITokenRepository["deleteRefreshToken"],
};

describe("RefreshUseCase", () => {
  let refreshUseCase: RefreshUseCase;

  beforeEach(() => {
    refreshUseCase = new RefreshUseCase(
      mockUserRepository,
      mockTokenRepository,
    );
    mockVerifyRefreshToken.mockClear();
    mockGenerateAccessToken.mockClear();
    mockGenerateRefreshToken.mockClear();
    mockFindRefreshToken.mockReset();
    mockSaveRefreshToken.mockReset();
    mockDeleteRefreshToken.mockReset();
  });

  afterEach(() => {
    mock.restore();
  });

  it("should refresh tokens successfully", async () => {
    // Arrange
    const currentRefreshToken = "valid_refresh_token";
    mockFindRefreshToken.mockResolvedValue(currentRefreshToken);

    // Act
    const result = await refreshUseCase.execute(currentRefreshToken);

    // Assert
    expect(mockVerifyRefreshToken).toHaveBeenCalledWith(currentRefreshToken);
    expect(mockTokenRepository.findRefreshToken).toHaveBeenCalledWith(
      "uuid-123",
    );
    expect(mockGenerateAccessToken).toHaveBeenCalled();
    expect(mockGenerateRefreshToken).toHaveBeenCalled();
    expect(mockTokenRepository.saveRefreshToken).toHaveBeenCalledWith(
      "uuid-123",
      "new_refresh_token",
    );
    expect(result).toEqual({
      accessToken: "new_access_token",
      refreshToken: "new_refresh_token",
    });
  });

  it("should throw error if token is invalid (not found in repo)", async () => {
    // Arrange
    const currentRefreshToken = "invalid_refresh_token";
    mockFindRefreshToken.mockResolvedValue(null);

    // Act & Assert
    expect(refreshUseCase.execute(currentRefreshToken)).rejects.toThrow(
      "Invalid refresh token",
    );
    expect(mockTokenRepository.deleteRefreshToken).toHaveBeenCalledWith(
      "uuid-123",
    );
  });

  it("should throw error if token does not match (reuse attempt)", async () => {
    // Arrange
    const currentRefreshToken = "old_refresh_token";
    const storedToken = "different_refresh_token";
    mockFindRefreshToken.mockResolvedValue(storedToken);

    // Act & Assert
    expect(refreshUseCase.execute(currentRefreshToken)).rejects.toThrow(
      "Invalid refresh token",
    );
    expect(mockTokenRepository.deleteRefreshToken).toHaveBeenCalledWith(
      "uuid-123",
    );
  });
});

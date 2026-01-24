import { describe, it, expect, mock, beforeEach, type Mock } from "bun:test";
import { RefreshUseCase } from "./refreshUseCase";
import { ITokenRepository } from "@/domain/repository/tokenRepository";
import { TokenService } from "@/service/auth/tokenService";

// Mock ITokenRepository
const mockTokenRepository = {
  saveRefreshToken: mock() as Mock<ITokenRepository["saveRefreshToken"]>,
  findRefreshToken: mock() as Mock<ITokenRepository["findRefreshToken"]>,
  findOldRefreshToken: mock() as Mock<ITokenRepository["findOldRefreshToken"]>,
  deleteRefreshToken: mock() as Mock<ITokenRepository["deleteRefreshToken"]>,
} as unknown as ITokenRepository;

// Mock TokenService
const mockTokenService = {
  verifyRefreshToken: mock() as Mock<TokenService["verifyRefreshToken"]>,
  generateTokenPair: mock() as Mock<TokenService["generateTokenPair"]>,
  generateAccessToken: mock() as Mock<TokenService["generateAccessToken"]>,
} as unknown as TokenService;

describe("RefreshUseCase", () => {
  let refreshUseCase: RefreshUseCase;

  beforeEach(() => {
    refreshUseCase = new RefreshUseCase(mockTokenRepository, mockTokenService);
    (mockTokenService.verifyRefreshToken as Mock<TokenService["verifyRefreshToken"]>).mockClear();
    (mockTokenService.generateTokenPair as Mock<TokenService["generateTokenPair"]>).mockClear();
    (mockTokenService.generateAccessToken as Mock<TokenService["generateAccessToken"]>).mockClear();
    (mockTokenRepository.findRefreshToken as Mock<ITokenRepository["findRefreshToken"]>).mockClear();
    (mockTokenRepository.findOldRefreshToken as Mock<ITokenRepository["findOldRefreshToken"]>).mockClear();
    (mockTokenRepository.saveRefreshToken as Mock<ITokenRepository["saveRefreshToken"]>).mockClear();
  });

  it("should refresh tokens successfully", async () => {
    // Arrange
    const currentRefreshToken = "valid_refresh_token";
    const payload = { userId: "uuid-123", email: "test@example.com" };

    (mockTokenService.verifyRefreshToken as Mock<TokenService["verifyRefreshToken"]>).mockReturnValue(payload);
    (mockTokenRepository.findRefreshToken as Mock<ITokenRepository["findRefreshToken"]>).mockResolvedValue(
      currentRefreshToken
    );
    (mockTokenRepository.findOldRefreshToken as Mock<ITokenRepository["findOldRefreshToken"]>).mockResolvedValue(null);
    (mockTokenService.generateTokenPair as Mock<TokenService["generateTokenPair"]>).mockReturnValue({
      accessToken: "new_access_token",
      refreshToken: "new_refresh_token",
    });

    // Act
    const result = await refreshUseCase.execute(currentRefreshToken);

    // Assert
    expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(currentRefreshToken);
    expect(mockTokenRepository.findRefreshToken).toHaveBeenCalledWith(payload.userId);
    expect(mockTokenService.generateTokenPair).toHaveBeenCalledWith(payload);
    expect(mockTokenRepository.saveRefreshToken).toHaveBeenCalledWith(payload.userId, "new_refresh_token");
    expect(result).toEqual({
      accessToken: "new_access_token",
      refreshToken: "new_refresh_token",
    });
  });

  it("should throw error if token does not match (reuse attempt)", async () => {
    // Arrange
    const currentRefreshToken = "old_refresh_token";
    const storedToken = "different_refresh_token";
    const payload = { userId: "uuid-123", email: "test@example.com" };

    (mockTokenService.verifyRefreshToken as Mock<TokenService["verifyRefreshToken"]>).mockReturnValue(payload);
    (mockTokenRepository.findRefreshToken as Mock<ITokenRepository["findRefreshToken"]>).mockResolvedValue(storedToken);
    (mockTokenRepository.findOldRefreshToken as Mock<ITokenRepository["findOldRefreshToken"]>).mockResolvedValue(null);

    // Act & Assert
    expect(refreshUseCase.execute(currentRefreshToken)).rejects.toThrow("Invalid refresh token");
  });

  it("should refresh successfully with old token during grace period", async () => {
    // Arrange
    const oldRefreshToken = "old_refresh_token";
    const currentStoredToken = "current_stored_token";
    const payload = { userId: "uuid-123", email: "test@example.com" };

    (mockTokenService.verifyRefreshToken as Mock<TokenService["verifyRefreshToken"]>).mockReturnValue(payload);
    (mockTokenRepository.findRefreshToken as Mock<ITokenRepository["findRefreshToken"]>).mockResolvedValue(
      currentStoredToken
    );
    (mockTokenRepository.findOldRefreshToken as Mock<ITokenRepository["findOldRefreshToken"]>).mockResolvedValue(
      oldRefreshToken
    );
    (mockTokenService.generateAccessToken as Mock<TokenService["generateAccessToken"]>).mockReturnValue(
      "new_access_token"
    );

    // Act
    const result = await refreshUseCase.execute(oldRefreshToken);

    // Assert
    expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(oldRefreshToken);
    expect(mockTokenRepository.findRefreshToken).toHaveBeenCalledWith(payload.userId);
    expect(mockTokenRepository.findOldRefreshToken).toHaveBeenCalledWith(payload.userId);
    expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(payload);
    // Should NOT generate new refresh token or save it
    expect(mockTokenService.generateTokenPair).not.toHaveBeenCalled();
    expect(mockTokenRepository.saveRefreshToken).not.toHaveBeenCalled();

    expect(result).toEqual({
      accessToken: "new_access_token",
      refreshToken: currentStoredToken,
    });
  });
});

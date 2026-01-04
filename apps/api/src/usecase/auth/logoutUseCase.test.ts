import { describe, it, expect, mock, beforeEach, type Mock } from "bun:test";
import { ITokenRepository } from "@/domain/repository/tokenRepository";
import { LogoutUseCase } from "./logoutUseCase";

// Mock ITokenRepository
const mockTokenRepository = {
  deleteRefreshToken: mock() as Mock<ITokenRepository["deleteRefreshToken"]>,
} as unknown as ITokenRepository;

describe("LogoutUseCase", () => {
  let logoutUseCase: LogoutUseCase;

  beforeEach(() => {
    logoutUseCase = new LogoutUseCase(mockTokenRepository);
    (mockTokenRepository.deleteRefreshToken as Mock<ITokenRepository["deleteRefreshToken"]>).mockClear();
  });

  it("should delete refresh token successfully", async () => {
    // Arrange
    const userId = "uuid-123";
    (mockTokenRepository.deleteRefreshToken as Mock<ITokenRepository["deleteRefreshToken"]>).mockResolvedValue(
      undefined
    );

    // Act
    await logoutUseCase.execute(userId);

    // Assert
    expect(mockTokenRepository.deleteRefreshToken).toHaveBeenCalledWith(userId);
  });
});

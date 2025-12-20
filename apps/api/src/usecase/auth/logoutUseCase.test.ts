import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ITokenRepository } from "@/domain/repository/tokenRepository";
import { LogoutUseCase } from "./logoutUseCase";

// Mock ITokenRepository
const mockSaveRefreshToken = mock();
const mockFindRefreshToken = mock();
const mockFindOldRefreshToken = mock();
const mockDeleteRefreshToken = mock();

const mockTokenRepository: ITokenRepository = {
  saveRefreshToken: mockSaveRefreshToken as ITokenRepository["saveRefreshToken"],
  findRefreshToken: mockFindRefreshToken as ITokenRepository["findRefreshToken"],
  findOldRefreshToken: mockFindOldRefreshToken as ITokenRepository["findOldRefreshToken"],
  deleteRefreshToken: mockDeleteRefreshToken as ITokenRepository["deleteRefreshToken"],
};

describe("LogoutUseCase", () => {
  let logoutUseCase: LogoutUseCase;

  beforeEach(() => {
    logoutUseCase = new LogoutUseCase(mockTokenRepository);
    mockDeleteRefreshToken.mockReset();
  });

  it("should delete refresh token successfully", async () => {
    // Arrange
    const userId = "uuid-123";
    mockDeleteRefreshToken.mockResolvedValue(undefined);

    // Act
    await logoutUseCase.execute(userId);

    // Assert
    expect(mockTokenRepository.deleteRefreshToken).toHaveBeenCalledWith(userId);
  });
});

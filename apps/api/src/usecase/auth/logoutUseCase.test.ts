import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { ITokenRepository } from '@/domain/repository/tokenRepository';
import { LogoutUseCase } from './logoutUseCase';

// Mock ITokenRepository
const mockTokenRepository = {
  saveRefreshToken: mock(),
  findRefreshToken: mock(),
  deleteRefreshToken: mock(),
} as unknown as ITokenRepository;

describe('LogoutUseCase', () => {
  let logoutUseCase: LogoutUseCase;

  beforeEach(() => {
    logoutUseCase = new LogoutUseCase(mockTokenRepository);
    (mockTokenRepository.deleteRefreshToken as any).mockReset();
  });

  it('should delete refresh token successfully', async () => {
    // Arrange
    const userId = 'uuid-123';
    (mockTokenRepository.deleteRefreshToken as any).mockResolvedValue(undefined);

    // Act
    await logoutUseCase.execute(userId);

    // Assert
    expect(mockTokenRepository.deleteRefreshToken).toHaveBeenCalledWith(userId);
  });
});

import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { GetMeUseCase } from './getMeUseCase';
import { IUserRepository } from '@/domain/repository/userRepository';
import { User, Email, Password } from '@paypay-money-diary/shared';

// Mock IUserRepository
const mockUserRepository = {
  findByEmail: mock(),
  findById: mock(),
  create: mock(),
} as unknown as IUserRepository;

describe('GetMeUseCase', () => {
  let getMeUseCase: GetMeUseCase;

  beforeEach(() => {
    getMeUseCase = new GetMeUseCase(mockUserRepository);
    (mockUserRepository.findById as any).mockReset();
  });

  it('should return user information successfully', async () => {
    // Arrange
    const userId = 'uuid-123';
    const mockUser: User = {
      id: userId,
      name: 'Test User',
      email: Email.create('test@example.com'),
      password: Password.create('hashed_password'),
    };

    (mockUserRepository.findById as any).mockResolvedValue(mockUser);

    // Act
    const result = await getMeUseCase.execute(userId);

    // Assert
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(result).toEqual({
      id: mockUser.id!,
      name: mockUser.name,
      email: mockUser.email.toString(),
    });
  });

  it('should throw error if user not found', async () => {
    // Arrange
    const userId = 'non-existent-uuid';
    (mockUserRepository.findById as any).mockResolvedValue(null);

    // Act & Assert
    expect(getMeUseCase.execute(userId)).rejects.toThrow('User not found');
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
  });
});

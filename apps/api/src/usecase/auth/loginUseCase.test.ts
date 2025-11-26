import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { IUserRepository } from '@/domain/repository/userRepository';
import { ITokenRepository } from '@/domain/repository/tokenRepository';
import { LoginInput, User, Email, Password } from '@paypay-money-diary/shared';
import { hash } from 'bcryptjs';

// Mock dependencies
const mockGenerateAccessToken = mock(() => 'mock_access_token');
const mockGenerateRefreshToken = mock(() => 'mock_refresh_token');

mock.module('@/infrastructure/auth/jwt', () => ({
  generateAccessToken: mockGenerateAccessToken,
  generateRefreshToken: mockGenerateRefreshToken,
}));

// Import LoginUseCase AFTER mocking modules
import { LoginUseCase } from './loginUseCase';

// Mock IUserRepository
const mockUserRepository = {
  findByEmail: mock(),
  findById: mock(),
  create: mock(),
} as unknown as IUserRepository;

// Mock ITokenRepository
const mockTokenRepository = {
  saveRefreshToken: mock(),
  findRefreshToken: mock(),
  deleteRefreshToken: mock(),
} as unknown as ITokenRepository;

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;

  beforeEach(() => {
    loginUseCase = new LoginUseCase(mockUserRepository, mockTokenRepository);
    mockGenerateAccessToken.mockClear();
    mockGenerateRefreshToken.mockClear();
    (mockUserRepository.findByEmail as any).mockReset();
    (mockTokenRepository.saveRefreshToken as any).mockReset();
  });

  afterEach(() => {
    mock.restore();
  });

  it('should login successfully with valid credentials', async () => {
    // Arrange
    const input: LoginInput = {
      email: 'test@example.com',
      password: 'password123',
    };

    const hashedPassword = await hash(input.password, 10);
    const mockUser: User = {
      id: 'uuid-123',
      name: 'Test User',
      email: Email.create(input.email),
      password: Password.create(hashedPassword),
    };

    (mockUserRepository.findByEmail as any).mockResolvedValue(mockUser);
    (mockTokenRepository.saveRefreshToken as any).mockResolvedValue(undefined);

    // Act
    const result = await loginUseCase.execute(input);

    // Assert
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(mockGenerateAccessToken).toHaveBeenCalled();
    expect(mockGenerateRefreshToken).toHaveBeenCalled();
    expect(mockTokenRepository.saveRefreshToken).toHaveBeenCalledWith(mockUser.id!, 'mock_refresh_token');
    expect(result).toEqual({
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      user: {
        id: mockUser.id!,
        name: mockUser.name,
        email: mockUser.email.toString(),
      },
    });
  });

  it('should throw error if user not found', async () => {
    // Arrange
    const input: LoginInput = {
      email: 'notfound@example.com',
      password: 'password123',
    };

    (mockUserRepository.findByEmail as any).mockResolvedValue(null);

    // Act & Assert
    expect(loginUseCase.execute(input)).rejects.toThrow('Invalid credentials');
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
  });

  it('should throw error if password is invalid', async () => {
    // Arrange
    const input: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    const hashedPassword = await hash('correctpassword', 10);
    const mockUser: User = {
      id: 'uuid-123',
      name: 'Test User',
      email: Email.create(input.email),
      password: Password.create(hashedPassword),
    };

    (mockUserRepository.findByEmail as any).mockResolvedValue(mockUser);

    // Act & Assert
    expect(loginUseCase.execute(input)).rejects.toThrow('Invalid credentials');
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
  });
});

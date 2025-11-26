import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { SignupUseCase } from './signupUseCase';
import { IUserRepository } from '@/domain/repository/userRepository';
import { CreateUserInput, User, Email, Password } from '@paypay-money-diary/shared';

// Mock IUserRepository
const mockUserRepository = {
  findByEmail: mock(),
  findById: mock(),
  create: mock(),
} as unknown as IUserRepository;

describe('SignupUseCase', () => {
  let signupUseCase: SignupUseCase;

  beforeEach(() => {
    signupUseCase = new SignupUseCase(mockUserRepository);
    (mockUserRepository.findByEmail as any).mockReset();
    (mockUserRepository.create as any).mockReset();
  });

  it('should create a new user successfully', async () => {
    // Arrange
    const input: CreateUserInput = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser: User = {
      id: 'uuid-123',
      name: input.name,
      email: Email.create(input.email),
      password: Password.create('hashed_password'),
    };

    (mockUserRepository.findByEmail as any).mockResolvedValue(null);
    (mockUserRepository.create as any).mockResolvedValue(mockUser);

    // Act
    const result = await signupUseCase.execute(input);

    // Assert
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(mockUserRepository.create).toHaveBeenCalled();
    expect(result).toEqual({
      id: mockUser.id!,
      name: mockUser.name,
      email: mockUser.email.toString(),
    });
  });

  it('should throw error if user already exists', async () => {
    // Arrange
    const input: CreateUserInput = {
      name: 'Test User',
      email: 'existing@example.com',
      password: 'password123',
    };

    const existingUser: User = {
      id: 'uuid-existing',
      name: 'Existing User',
      email: Email.create(input.email),
      password: Password.create('hashed_password'),
    };

    (mockUserRepository.findByEmail as any).mockResolvedValue(existingUser);

    // Act & Assert
    expect(signupUseCase.execute(input)).rejects.toThrow('User already exists');
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });
});

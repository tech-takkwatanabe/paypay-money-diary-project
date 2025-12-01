import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { GetMeUseCase } from './getMeUseCase';
import { IUserRepository } from '@/domain/repository/userRepository';
import { User, Email, Password } from '@paypay-money-diary/shared';

// Mock IUserRepository
const mockFindByEmail = mock();
const mockFindById = mock();
const mockCreate = mock();

const mockUserRepository: IUserRepository = {
	findByEmail: mockFindByEmail as IUserRepository['findByEmail'],
	findById: mockFindById as IUserRepository['findById'],
	create: mockCreate as IUserRepository['create'],
};

describe('GetMeUseCase', () => {
	let getMeUseCase: GetMeUseCase;

	beforeEach(() => {
		getMeUseCase = new GetMeUseCase(mockUserRepository);
		mockFindById.mockReset();
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

		mockFindById.mockResolvedValue(mockUser);

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
		mockFindById.mockResolvedValue(null);

		// Act & Assert
		expect(getMeUseCase.execute(userId)).rejects.toThrow('User not found');
		expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
	});
});

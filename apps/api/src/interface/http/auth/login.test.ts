import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { LoginSchema } from '@paypay-money-diary/shared';
import { loginHandler } from './login';

// Mock dependencies
const mockLoginExecute = mock();

mock.module('@/usecase/auth/loginUseCase', () => ({
	LoginUseCase: class {
		execute = mockLoginExecute;
	},
}));

mock.module('@/infrastructure/repository/userRepository', () => ({
	UserRepository: class {},
}));

mock.module('@/infrastructure/repository/tokenRepository', () => ({
	RedisTokenRepository: class {},
}));

describe('loginHandler', () => {
	let app: Hono;

	beforeEach(() => {
		app = new Hono();
		app.post('/login', zValidator('json', LoginSchema), loginHandler);
		mockLoginExecute.mockReset();
	});

	it('should return 200 with user data and set cookies on successful login', async () => {
		// Arrange
		const mockResponse = {
			accessToken: 'access_token_123',
			refreshToken: 'refresh_token_123',
			user: {
				id: 'uuid-123',
				name: 'Test User',
				email: 'test@example.com',
			},
		};
		mockLoginExecute.mockResolvedValue(mockResponse);

		// Act
		const res = await app.request('/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'test@example.com',
				password: 'password123',
			}),
		});

		// Assert
		expect(res.status).toBe(200);

		// レスポンスボディにはトークンを含めない（Cookie で送信）
		const data = await res.json();
		expect(data).toEqual({
			user: mockResponse.user,
		});

		// Cookie が設定されていることを確認
		const cookies = res.headers.get('set-cookie');
		expect(cookies).toContain('accessToken=');
	});

	it('should return 400 on validation error', async () => {
		// Act
		const res = await app.request('/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'invalid-email',
				password: 'short',
			}),
		});

		// Assert
		expect(res.status).toBe(400);
	});

	it('should return 401 on invalid credentials', async () => {
		// Arrange
		mockLoginExecute.mockRejectedValue(new Error('Invalid credentials'));

		// Act
		const res = await app.request('/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'test@example.com',
				password: 'wrongpassword',
			}),
		});

		// Assert
		expect(res.status).toBe(401);
		const data = await res.json();
		expect(data).toHaveProperty('error');
	});
});

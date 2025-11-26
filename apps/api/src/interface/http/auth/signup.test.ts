import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateUserSchema } from '@paypay-money-diary/shared';
import { signupHandler } from './signup';

// Mock dependencies
const mockSignupExecute = mock();

mock.module('@/usecase/auth/signupUseCase', () => ({
  SignupUseCase: class {
    execute = mockSignupExecute;
  },
}));

mock.module('@/infrastructure/repository/userRepository', () => ({
  UserRepository: class {},
}));

describe('signupHandler', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.post('/signup', zValidator('json', CreateUserSchema), signupHandler);
    mockSignupExecute.mockReset();
  });

  it('should return 201 with user data on successful signup', async () => {
    // Arrange
    const mockResponse = {
      id: 'uuid-123',
      name: 'Test User',
      email: 'test@example.com',
    };
    mockSignupExecute.mockResolvedValue(mockResponse);

    // Act
    const res = await app.request('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    // Assert
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual(mockResponse);
  });

  it('should return 400 on validation error', async () => {
    // Act
    const res = await app.request('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'invalid-email', // Invalid email
        password: 'short', // Too short password
      }),
    });

    // Assert
    expect(res.status).toBe(400);
  });

  it('should return 409 on duplicate user error', async () => {
    // Arrange
    mockSignupExecute.mockRejectedValue(new Error('User already exists'));

    // Act
    const res = await app.request('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    // Assert
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});

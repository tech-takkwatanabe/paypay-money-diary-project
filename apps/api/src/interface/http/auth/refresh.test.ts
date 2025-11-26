import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Hono } from 'hono';
import { refreshHandler } from './refresh';

// Mock dependencies
const mockRefreshExecute = mock();

mock.module('@/usecase/auth/refreshUseCase', () => ({
  RefreshUseCase: class {
    execute = mockRefreshExecute;
  },
}));

mock.module('@/infrastructure/repository/userRepository', () => ({
  UserRepository: class {},
}));

mock.module('@/infrastructure/repository/tokenRepository', () => ({
  RedisTokenRepository: class {},
}));

describe('refreshHandler', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.post('/refresh', refreshHandler);
    mockRefreshExecute.mockReset();
  });

  it('should return 200 with new tokens on successful refresh', async () => {
    // Arrange
    const mockResponse = {
      accessToken: 'new_access_token',
      refreshToken: 'new_refresh_token',
    };
    mockRefreshExecute.mockResolvedValue(mockResponse);

    // Act
    const res = await app.request('/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: 'old_refresh_token',
      }),
    });

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockResponse);
  });

  it('should return 400 on missing refresh token', async () => {
    // Act
    const res = await app.request('/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Assert
    expect(res.status).toBe(400);
  });

  it('should return 401 on invalid refresh token', async () => {
    // Arrange
    mockRefreshExecute.mockImplementation(() => Promise.reject(new Error('Invalid refresh token')));

    // Act
    const res = await app.request('/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: 'invalid_token',
      }),
    });

    // Assert
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});

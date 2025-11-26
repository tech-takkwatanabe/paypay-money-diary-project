import { Context } from 'hono';
import { RefreshUseCase } from '@/usecase/auth/refreshUseCase';
import { UserRepository } from '@/infrastructure/repository/userRepository';
import { z } from 'zod';

const RefreshSchema = z.object({
  refreshToken: z.string(),
});

import { RedisTokenRepository } from '@/infrastructure/repository/tokenRepository';

export const refreshHandler = async (c: Context) => {
  const body = await c.req.json();
  const result = RefreshSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const { refreshToken } = result.data;
  const userRepository = new UserRepository();
  const tokenRepository = new RedisTokenRepository();
  const refreshUseCase = new RefreshUseCase(userRepository, tokenRepository);

  try {
    const response = await refreshUseCase.execute(refreshToken);
    return c.json(response, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Invalid refresh token' }, 401);
  }
};

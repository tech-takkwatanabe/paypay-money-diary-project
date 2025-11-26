import { Context } from 'hono';
import { LoginUseCase } from '@/usecase/auth/loginUseCase';
import { UserRepository } from '@/infrastructure/repository/userRepository';
import { RedisTokenRepository } from '@/infrastructure/repository/tokenRepository';
import { LoginInput } from '@paypay-money-diary/shared';

export const loginHandler = async (c: Context) => {
  // Dependency Injection
  const userRepository = new UserRepository();
  const tokenRepository = new RedisTokenRepository();
  const loginUseCase = new LoginUseCase(userRepository, tokenRepository);

  // Input is already validated by zValidator middleware
  const input = c.req.valid('json' as never) as LoginInput;

  try {
    const result = await loginUseCase.execute(input);
    return c.json(result, 200);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      return c.json({ error: 'Invalid email or password' }, 401);
    }
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

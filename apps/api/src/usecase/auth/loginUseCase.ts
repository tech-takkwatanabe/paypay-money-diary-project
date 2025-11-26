import { compare } from 'bcryptjs';
import { IUserRepository } from '@/domain/repository/userRepository';
import { LoginInput } from '@paypay-money-diary/shared';
import { generateAccessToken, generateRefreshToken } from '@/infrastructure/auth/jwt';
import { redis } from '@/infrastructure/redis/client';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export class LoginUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: LoginInput): Promise<LoginResponse> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Verify password
    const isPasswordValid = await compare(input.password, user.password.value);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // 3. Generate tokens
    const payload = {
      userId: user.id!,
      email: user.email.toString(),
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // 4. Store refresh token in Redis (expires in 7 days)
    const refreshTokenKey = `refresh_token:${user.id}`;
    await redis.setex(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken);

    // 5. Return tokens and user info
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id!,
        name: user.name,
        email: user.email.toString(),
      },
    };
  }
}

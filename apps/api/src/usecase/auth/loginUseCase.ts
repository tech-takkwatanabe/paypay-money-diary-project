import { compare } from 'bcryptjs';
import { IUserRepository } from '@/domain/repository/userRepository';
import { ITokenRepository } from '@/domain/repository/tokenRepository';
import { LoginInput } from '@paypay-money-diary/shared';
import { generateAccessToken, generateRefreshToken } from '@/infrastructure/auth/jwt';

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
  constructor(
    private userRepository: IUserRepository,
    private tokenRepository: ITokenRepository
  ) {}

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

    // 4. Store refresh token
    await this.tokenRepository.saveRefreshToken(user.id!, refreshToken);

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

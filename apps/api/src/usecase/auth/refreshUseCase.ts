import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/infrastructure/auth/jwt';
import { IUserRepository } from '@/domain/repository/userRepository';
import { ITokenRepository } from '@/domain/repository/tokenRepository';

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export class RefreshUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tokenRepository: ITokenRepository
  ) {}

  async execute(currentRefreshToken: string): Promise<RefreshResponse> {
    // 1. Verify JWT signature and expiration
    const payload = verifyRefreshToken(currentRefreshToken);
    
    // 2. Check if token exists in repository and matches
    const storedToken = await this.tokenRepository.findRefreshToken(payload.userId);

    if (!storedToken || storedToken !== currentRefreshToken) {
      // Security: If token doesn't match, it might be a reuse attempt. 
      // Ideally we should invalidate all tokens for this user, but for now just throw error.
      await this.tokenRepository.deleteRefreshToken(payload.userId);
      throw new Error('Invalid refresh token');
    }

    // 3. Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      email: payload.email,
    });

    // 4. Update repository with new refresh token (rotate)
    await this.tokenRepository.saveRefreshToken(payload.userId, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

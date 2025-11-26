import { ITokenRepository } from '@/domain/repository/tokenRepository';

export class LogoutUseCase {
  constructor(private tokenRepository: ITokenRepository) {}

  async execute(userId: string): Promise<void> {
    await this.tokenRepository.deleteRefreshToken(userId);
  }
}

import { ITokenRepository } from "@/domain/repository/tokenRepository";
import { TokenService } from "@/service/auth/tokenService";

/**
 * Refresh Response
 */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Refresh Use Case
 * トークン更新のユースケースを実装
 */
export class RefreshUseCase {
  constructor(
    private tokenRepository: ITokenRepository,
    private tokenService: TokenService
  ) {}

  async execute(currentRefreshToken: string): Promise<RefreshResponse> {
    // 1. JWT署名と有効期限を検証（Service層に委譲）
    const payload = this.tokenService.verifyRefreshToken(currentRefreshToken);

    // 2. トークンがリポジトリに存在し、一致するかチェック
    const [storedToken, oldStoredToken] = await Promise.all([
      this.tokenRepository.findRefreshToken(payload.userId),
      this.tokenRepository.findOldRefreshToken(payload.userId),
    ]);

    // ケース1: 現在の有効なトークンと一致する場合 -> 通常のローテーション
    if (storedToken && storedToken === currentRefreshToken) {
      // 3. 新しいトークンを生成（Service層に委譲）
      const { accessToken, refreshToken } = this.tokenService.generateTokenPair({
        userId: payload.userId,
        email: payload.email,
      });

      // 4. リポジトリを新しいリフレッシュトークンで更新（ローテーション）
      await this.tokenRepository.saveRefreshToken(payload.userId, refreshToken);

      return {
        accessToken,
        refreshToken,
      };
    }

    // ケース2: 猶予期間中の古いトークンと一致する場合 -> 現在の有効なトークンを返す（再ローテーションしない）
    if (oldStoredToken && oldStoredToken === currentRefreshToken && storedToken) {
      const accessToken = this.tokenService.generateAccessToken({
        userId: payload.userId,
        email: payload.email,
      });

      return {
        accessToken,
        refreshToken: storedToken, // 現在の有効なトークンをそのまま返す
      };
    }

    // ケース3: どちらにも一致しない場合 -> 無効なトークン
    throw new Error("Invalid refresh token");
  }
}

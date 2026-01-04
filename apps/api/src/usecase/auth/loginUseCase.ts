import { ITokenRepository } from "@/domain/repository/tokenRepository";
import { LoginInput } from "@paypay-money-diary/shared";
import { AuthService } from "@/service/auth/authService";
import { TokenService } from "@/service/auth/tokenService";
import { User } from "@/domain/entity/user";

/**
 * Login Response
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * Login Use Case
 * ログインのユースケースを実装
 */
export class LoginUseCase {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private tokenRepository: ITokenRepository
  ) {}

  async execute(input: LoginInput): Promise<LoginResponse> {
    // 1. ユーザー認証（Service層に委譲）
    const user = await this.authService.authenticateUser(input.email, input.password);

    // 2. トークン生成（Service層に委譲）
    const { accessToken, refreshToken } = this.tokenService.generateTokenPair({
      userId: user.id,
      email: user.email.toString(),
    });

    // 3. リフレッシュトークンを保存
    await this.tokenRepository.saveRefreshToken(user.id, refreshToken);

    // 4. 結果を返す（Entityを返す）
    return {
      accessToken,
      refreshToken,
      user,
    };
  }
}

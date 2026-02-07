import * as jwt from "@/infrastructure/auth/jwt";

/**
 * Token Payload
 */
export type TokenPayload = {
  userId: string;
  email: string;
};

/**
 * Token Pair
 */
export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Token Service
 * トークン生成と検証を担当
 */
export class TokenService {
  constructor(private jwtProvider = jwt) {}

  /**
   * アクセストークンとリフレッシュトークンを生成
   */
  generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: this.jwtProvider.generateAccessToken(payload),
      refreshToken: this.jwtProvider.generateRefreshToken(payload),
    };
  }

  /**
   * アクセストークンのみを生成
   */
  generateAccessToken(payload: TokenPayload): string {
    return this.jwtProvider.generateAccessToken(payload);
  }

  /**
   * リフレッシュトークンを検証
   */
  verifyRefreshToken(token: string): TokenPayload {
    return this.jwtProvider.verifyRefreshToken(token) as TokenPayload;
  }
}

import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/infrastructure/auth/jwt";

/**
 * Token Payload
 */
export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Token Pair
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Token Service
 * トークン生成と検証を担当
 */
export class TokenService {
  /**
   * アクセストークンとリフレッシュトークンを生成
   */
  generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  /**
   * アクセストークンのみを生成
   */
  generateAccessToken(payload: TokenPayload): string {
    return generateAccessToken(payload);
  }

  /**
   * リフレッシュトークンを検証
   */
  verifyRefreshToken(token: string): TokenPayload {
    return verifyRefreshToken(token) as TokenPayload;
  }
}

import * as jwt from "@/infrastructure/auth/jwt";

import { TokenPayload } from "../../types/token";

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
    const decoded = this.jwtProvider.verifyRefreshToken(token);
    if (typeof decoded === "object" && decoded !== null && "userId" in decoded && "email" in decoded) {
      return decoded as TokenPayload;
    }
    throw new Error("Invalid token payload");
  }
}

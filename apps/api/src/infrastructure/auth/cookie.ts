/**
 * Cookie 設定ユーティリティ
 * HttpOnly Cookie を使用した安全な認証
 */

import { Context } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";

// Cookie 設定オプション

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true, // HTTPS必須
  sameSite: "Strict" as const,
  path: "/api",
};

/**
 * 有効期限文字列を秒数に変換
 * @example "15m" -> 900, "7d" -> 604800
 */
const parseExpiresIn = (expiresIn: string): number => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expires format: ${expiresIn}`);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 24 * 60 * 60;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
};

// Access Token 有効期限 (環境変数から取得)
const ACCESS_TOKEN_MAX_AGE = parseExpiresIn(
  process.env.JWT_ACCESS_EXPIRES_IN || "15m",
);

// Refresh Token 有効期限 (環境変数から取得)
const REFRESH_TOKEN_MAX_AGE = parseExpiresIn(
  process.env.JWT_REFRESH_EXPIRES_IN || "7d",
);

/**
 * 認証 Cookie を設定
 */
export const setAuthCookies = (
  c: Context,
  accessToken: string,
  refreshToken: string,
) => {
  // Access Token Cookie
  setCookie(c, "accessToken", accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  // Refresh Token Cookie (refresh エンドポイントのみで使用)
  setCookie(c, "refreshToken", refreshToken, {
    ...COOKIE_OPTIONS,
    path: "/api/auth", // refresh と logout でのみ使用
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
};

/**
 * 認証 Cookie をクリア
 */
export const clearAuthCookies = (c: Context) => {
  deleteCookie(c, "accessToken", {
    path: "/api",
    secure: true,
    httpOnly: true,
  });
  deleteCookie(c, "refreshToken", {
    path: "/api/auth",
    secure: true,
    httpOnly: true,
  });
};

/**
 * Access Token を Cookie から取得
 */
export const getAccessTokenFromCookie = (c: Context): string | undefined => {
  return getCookie(c, "accessToken");
};

/**
 * Refresh Token を Cookie から取得
 */
export const getRefreshTokenFromCookie = (c: Context): string | undefined => {
  return getCookie(c, "refreshToken");
};

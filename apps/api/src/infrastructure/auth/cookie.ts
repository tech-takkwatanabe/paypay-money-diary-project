/**
 * Cookie 設定ユーティリティ
 * HttpOnly Cookie を使用した安全な認証
 */

import { Context } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';

// Cookie 設定オプション

const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: true, // HTTPS必須
	sameSite: 'Strict' as const,
	path: '/api',
};

// Access Token: 短い有効期限 (15分)
const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15分

// Refresh Token: 長い有効期限 (7日)
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7日

/**
 * 認証 Cookie を設定
 */
export const setAuthCookies = (c: Context, accessToken: string, refreshToken: string) => {
	// Access Token Cookie
	setCookie(c, 'accessToken', accessToken, {
		...COOKIE_OPTIONS,
		maxAge: ACCESS_TOKEN_MAX_AGE,
	});

	// Refresh Token Cookie (refresh エンドポイントのみで使用)
	setCookie(c, 'refreshToken', refreshToken, {
		...COOKIE_OPTIONS,
		path: '/api/auth', // refresh と logout でのみ使用
		maxAge: REFRESH_TOKEN_MAX_AGE,
	});
};

/**
 * 認証 Cookie をクリア
 */
export const clearAuthCookies = (c: Context) => {
	deleteCookie(c, 'accessToken', {
		path: '/api',
		secure: true,
		httpOnly: true,
	});
	deleteCookie(c, 'refreshToken', {
		path: '/api/auth',
		secure: true,
		httpOnly: true,
	});
};

/**
 * Access Token を Cookie から取得
 */
export const getAccessTokenFromCookie = (c: Context): string | undefined => {
	return getCookie(c, 'accessToken');
};

/**
 * Refresh Token を Cookie から取得
 */
export const getRefreshTokenFromCookie = (c: Context): string | undefined => {
	return getCookie(c, 'refreshToken');
};

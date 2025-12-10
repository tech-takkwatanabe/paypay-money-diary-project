/**
 * 認証 API ルート定義 (OpenAPI 対応)
 * ハンドラーの実際の戻り値に合わせたスキーマ定義
 */

import { createRoute, z } from '@hono/zod-openapi';
import { CreateUserSchema, LoginSchema } from '@paypay-money-diary/shared';

// ===== スキーマ定義 (ハンドラーの戻り値に一致) =====

// signup handler returns: { id, name, email }
const SignupResponseSchema = z
	.object({
		id: z.string().openapi({ description: 'ユーザーID' }),
		name: z.string().openapi({ description: 'ユーザー名' }),
		email: z.string().email().openapi({ description: 'メールアドレス' }),
	})
	.openapi('SignupResponse');

// login handler returns: { accessToken, refreshToken, user: { id, name, email } }
const LoginResponseSchema = z
	.object({
		accessToken: z.string().openapi({ description: 'アクセストークン' }),
		refreshToken: z.string().openapi({ description: 'リフレッシュトークン' }),
		user: z.object({
			id: z.string().openapi({ description: 'ユーザーID' }),
			name: z.string().openapi({ description: 'ユーザー名' }),
			email: z.string().email().openapi({ description: 'メールアドレス' }),
		}),
	})
	.openapi('LoginResponse');

// refresh handler returns: { accessToken, refreshToken }
const TokensResponseSchema = z
	.object({
		accessToken: z.string().openapi({ description: 'アクセストークン' }),
		refreshToken: z.string().openapi({ description: 'リフレッシュトークン' }),
	})
	.openapi('TokensResponse');

// me handler returns: { id, name, email }
const MeResponseSchema = z
	.object({
		id: z.string().openapi({ description: 'ユーザーID' }),
		name: z.string().openapi({ description: 'ユーザー名' }),
		email: z.string().email().openapi({ description: 'メールアドレス' }),
	})
	.openapi('MeResponse');

// logout handler returns: { message }
const LogoutResponseSchema = z
	.object({
		message: z.string().openapi({ description: 'メッセージ' }),
	})
	.openapi('LogoutResponse');

const ErrorResponseSchema = z
	.object({
		error: z.string().openapi({ description: 'エラーメッセージ' }),
	})
	.openapi('ErrorResponse');

const RefreshTokenRequestSchema = z
	.object({
		refreshToken: z.string().openapi({ description: 'リフレッシュトークン' }),
	})
	.openapi('RefreshTokenRequest');

// ===== ルート定義 =====

export const signupRoute = createRoute({
	method: 'post',
	path: '/auth/signup',
	tags: ['認証'],
	summary: 'ユーザー登録',
	description: '新規ユーザーを登録します',
	request: {
		body: {
			content: {
				'application/json': {
					schema: CreateUserSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: '登録成功',
			content: {
				'application/json': {
					schema: SignupResponseSchema,
				},
			},
		},
		400: {
			description: 'バリデーションエラー',
			content: {
				'application/json': { schema: ErrorResponseSchema },
			},
		},
		409: {
			description: 'ユーザー既存',
			content: {
				'application/json': { schema: ErrorResponseSchema },
			},
		},
		500: {
			description: 'サーバーエラー',
			content: {
				'application/json': { schema: ErrorResponseSchema },
			},
		},
	},
});

export const loginRoute = createRoute({
	method: 'post',
	path: '/auth/login',
	tags: ['認証'],
	summary: 'ログイン',
	description: 'メールアドレスとパスワードでログインします',
	request: {
		body: {
			content: {
				'application/json': {
					schema: LoginSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: 'ログイン成功',
			content: {
				'application/json': {
					schema: LoginResponseSchema,
				},
			},
		},
		400: {
			description: 'バリデーションエラー',
			content: {
				'application/json': { schema: ErrorResponseSchema },
			},
		},
		401: {
			description: '認証失敗',
			content: {
				'application/json': { schema: ErrorResponseSchema },
			},
		},
		500: {
			description: 'サーバーエラー',
			content: {
				'application/json': { schema: ErrorResponseSchema },
			},
		},
	},
});

export const refreshRoute = createRoute({
	method: 'post',
	path: '/auth/refresh',
	tags: ['認証'],
	summary: 'トークン更新',
	description: 'リフレッシュトークンを使用して新しいアクセストークンを取得します',
	request: {
		body: {
			content: {
				'application/json': {
					schema: RefreshTokenRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: '更新成功',
			content: {
				'application/json': {
					schema: TokensResponseSchema,
				},
			},
		},
		400: {
			description: 'リフレッシュトークン不足',
			content: {
				'application/json': { schema: ErrorResponseSchema },
			},
		},
		401: {
			description: '無効なトークン',
			content: {
				'application/json': { schema: ErrorResponseSchema },
			},
		},
		500: {
			description: 'サーバーエラー',
			content: {
				'application/json': { schema: ErrorResponseSchema },
			},
		},
	},
});

export const logoutRoute = createRoute({
	method: 'post',
	path: '/auth/logout',
	tags: ['認証'],
	summary: 'ログアウト',
	description: 'リフレッシュトークンを無効化してログアウトします',
	security: [{ Bearer: [] }],
	responses: {
		200: {
			description: 'ログアウト成功',
			content: {
				'application/json': {
					schema: LogoutResponseSchema,
				},
			},
		},
		401: {
			description: '認証エラー',
			content: {
				'application/json': { schema: ErrorResponseSchema },
			},
		},
		500: {
			description: 'サーバーエラー',
			content: {
				'application/json': { schema: ErrorResponseSchema },
			},
		},
	},
});

export const meRoute = createRoute({
	method: 'get',
	path: '/auth/me',
	tags: ['認証'],
	summary: 'ユーザー情報取得',
	description: '認証済みユーザーの情報を取得します',
	security: [{ Bearer: [] }],
	responses: {
		200: {
			description: '取得成功',
			content: {
				'application/json': {
					schema: MeResponseSchema,
				},
			},
		},
		401: {
			description: '認証エラー',
			content: {
				'application/json': { schema: ErrorResponseSchema },
			},
		},
		500: {
			description: 'サーバーエラー',
			content: {
				'application/json': { schema: ErrorResponseSchema },
			},
		},
	},
});

// ルートから型を抽出してエクスポート
export type SignupRoute = typeof signupRoute;
export type LoginRoute = typeof loginRoute;
export type RefreshRoute = typeof refreshRoute;
export type LogoutRoute = typeof logoutRoute;
export type MeRoute = typeof meRoute;

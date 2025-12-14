/**
 * 認証 API ルート定義 (OpenAPI 対応)
 * HttpOnly Cookie 認証方式
 */

import { createRoute, z } from '@hono/zod-openapi';
import { CreateUserSchema, LoginSchema } from '@paypay-money-diary/shared';

// ===== スキーマ定義 =====

// ユーザー情報スキーマ
const UserSchema = z
	.object({
		id: z.string().openapi({ description: 'ユーザーID' }),
		name: z.string().openapi({ description: 'ユーザー名' }),
		email: z.string().email().openapi({ description: 'メールアドレス' }),
	})
	.openapi('User');

// signup handler returns: { id, name, email }
const SignupResponseSchema = UserSchema.openapi('SignupResponse');

// login handler returns: { user } (トークンはCookieで送信)
const LoginResponseSchema = z
	.object({
		user: UserSchema,
	})
	.openapi('LoginResponse');

// refresh handler returns: { message } (トークンはCookieで送信)
const RefreshResponseSchema = z
	.object({
		message: z.string().openapi({ description: 'メッセージ' }),
	})
	.openapi('RefreshResponse');

// me handler returns: { id, name, email }
const MeResponseSchema = UserSchema.openapi('MeResponse');

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

// ===== ルート定義 =====

export const signupRoute = createRoute({
	method: 'post',
	path: '/auth/signup',
	tags: ['Auth'],
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
	tags: ['Auth'],
	summary: 'ログイン',
	description: 'メールアドレスとパスワードでログインします。認証トークンはHttpOnly Cookieで設定されます。',
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
			description: 'ログイン成功（トークンはCookieに設定）',
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
	tags: ['Auth'],
	summary: 'トークン更新',
	description: 'Cookieに設定されたリフレッシュトークンを使用して新しいアクセストークンを取得します',
	responses: {
		200: {
			description: '更新成功（新しいトークンはCookieに設定）',
			content: {
				'application/json': {
					schema: RefreshResponseSchema,
				},
			},
		},
		400: {
			description: 'リフレッシュトークンが見つからない',
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
	tags: ['Auth'],
	summary: 'ログアウト',
	description: '認証Cookieをクリアしてログアウトします',
	security: [{ Cookie: [] }],
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
	tags: ['Auth'],
	summary: 'ユーザー情報取得',
	description: '認証済みユーザーの情報を取得します（Cookie認証）',
	security: [{ Cookie: [] }],
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

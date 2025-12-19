import { createRoute, z } from '@hono/zod-openapi';

// 予算スキーマ
export const BudgetSchema = z.object({
	id: z.string().uuid(),
	userId: z.string(),
	categoryId: z.string().uuid().nullable(),
	categoryName: z.string().nullable(), // レスポンス用
	amount: z.number().int().min(0),
	year: z.number().int(),
	month: z.number().int().min(1).max(12),
	createdAt: z.string(),
	updatedAt: z.string(),
});

// 予算作成・更新リクエスト
export const UpsertBudgetSchema = z.object({
	categoryId: z.string().uuid().nullable(),
	amount: z.number().int().min(0),
	year: z.number().int(),
	month: z.number().int().min(1).max(12),
});

// 予算一覧レスポンス
export const BudgetListResponseSchema = z.object({
	data: z.array(BudgetSchema),
});

// エラーレスポンス
const ErrorSchema = z.object({
	error: z.string(),
});

// GET /budgets
export const getBudgetsRoute = createRoute({
	method: 'get',
	path: '/budgets',
	tags: ['Budget'],
	summary: '予算一覧取得',
	description: '指定した年月の予算一覧を取得します。',
	request: {
		query: z.object({
			year: z.string().optional(),
			month: z.string().optional(),
		}),
	},
	responses: {
		200: {
			description: '予算一覧',
			content: {
				'application/json': {
					schema: BudgetListResponseSchema,
				},
			},
		},
		401: {
			description: '認証エラー',
			content: {
				'application/json': {
					schema: ErrorSchema,
				},
			},
		},
		500: {
			description: 'サーバーエラー',
			content: {
				'application/json': {
					schema: ErrorSchema,
				},
			},
		},
	},
	security: [{ Cookie: [] }],
});

// POST /budgets
export const upsertBudgetRoute = createRoute({
	method: 'post',
	path: '/budgets',
	tags: ['Budget'],
	summary: '予算設定・更新',
	description: '予算を設定または更新します。',
	request: {
		body: {
			content: {
				'application/json': {
					schema: UpsertBudgetSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: '設定された予算',
			content: {
				'application/json': {
					schema: BudgetSchema,
				},
			},
		},
		401: {
			description: '認証エラー',
			content: {
				'application/json': {
					schema: ErrorSchema,
				},
			},
		},
		400: {
			description: 'バリデーションエラー',
			content: {
				'application/json': {
					schema: ErrorSchema,
				},
			},
		},
		500: {
			description: 'サーバーエラー',
			content: {
				'application/json': {
					schema: ErrorSchema,
				},
			},
		},
	},
	security: [{ Cookie: [] }],
});

export type GetBudgetsRoute = typeof getBudgetsRoute;
export type UpsertBudgetRoute = typeof upsertBudgetRoute;

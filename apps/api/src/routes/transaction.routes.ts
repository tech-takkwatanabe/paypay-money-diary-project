/**
 * 取引 API ルート定義 (OpenAPI 対応)
 */

import { createRoute, z } from '@hono/zod-openapi';

// ===== 共通スキーマ =====

const ErrorResponseSchema = z
	.object({
		error: z.string().openapi({ description: 'エラーメッセージ' }),
	})
	.openapi('TransactionErrorResponse');

// ===== CSV アップロード =====

const UploadCsvResponseSchema = z
	.object({
		message: z.string().openapi({ description: 'メッセージ' }),
		uploadId: z.string().openapi({ description: 'アップロードID' }),
		totalRows: z.number().openapi({ description: '総行数' }),
		importedRows: z.number().openapi({ description: 'インポート行数' }),
		skippedRows: z.number().openapi({ description: 'スキップ行数' }),
		duplicateRows: z.number().openapi({ description: '重複行数' }),
	})
	.openapi('UploadCsvResponse');

export const uploadCsvRoute = createRoute({
	method: 'post',
	path: '/transactions/upload',
	tags: ['Transaction'],
	summary: 'CSV アップロード',
	description: 'PayPay CSV ファイルをアップロードして取引データをインポートします',
	security: [{ Bearer: [] }],
	request: {
		body: {
			content: {
				'multipart/form-data': {
					schema: z.object({
						file: z.string().openapi({
							description: 'CSV ファイル',
							format: 'binary',
						}),
					}),
				},
			},
		},
	},
	responses: {
		201: {
			description: 'アップロード成功',
			content: {
				'application/json': { schema: UploadCsvResponseSchema },
			},
		},
		400: {
			description: 'バリデーションエラー',
			content: {
				'application/json': { schema: ErrorResponseSchema },
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

// ===== 取引一覧 =====

const TransactionSchema = z
	.object({
		id: z.string().openapi({ description: '取引ID' }),
		transactionDate: z.string().openapi({ description: '取引日' }),
		amount: z.number().openapi({ description: '金額' }),
		merchant: z.string().openapi({ description: '取引先' }),
		paymentMethod: z.string().nullable().openapi({ description: '支払い方法' }),
		categoryId: z.string().nullable().openapi({ description: 'カテゴリID' }),
		categoryName: z.string().nullable().openapi({ description: 'カテゴリ名' }),
		categoryColor: z.string().nullable().openapi({ description: 'カテゴリ色' }),
	})
	.openapi('Transaction');

const PaginationSchema = z
	.object({
		page: z.number().openapi({ description: 'ページ番号' }),
		limit: z.number().openapi({ description: '1ページあたりの件数' }),
		totalCount: z.number().openapi({ description: '総件数' }),
		totalPages: z.number().openapi({ description: '総ページ数' }),
	})
	.openapi('Pagination');

const TransactionListResponseSchema = z
	.object({
		data: z.array(TransactionSchema).openapi({ description: '取引一覧' }),
		pagination: PaginationSchema,
	})
	.openapi('TransactionListResponse');

export const getTransactionsRoute = createRoute({
	method: 'get',
	path: '/transactions',
	tags: ['Transaction'],
	summary: '取引履歴取得',
	description: '取引履歴を取得します（ページネーション対応）',
	security: [{ Bearer: [] }],
	request: {
		query: z.object({
			page: z.string().optional().openapi({ description: 'ページ番号' }),
			limit: z.string().optional().openapi({ description: '1ページあたりの件数' }),
			startDate: z.string().optional().openapi({ description: '開始日 (YYYY-MM-DD)' }),
			endDate: z.string().optional().openapi({ description: '終了日 (YYYY-MM-DD)' }),
			categoryId: z.string().optional().openapi({ description: 'カテゴリID' }),
		}),
	},
	responses: {
		200: {
			description: '取得成功',
			content: {
				'application/json': { schema: TransactionListResponseSchema },
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

// ===== 取引集計 =====

const CategoryBreakdownSchema = z
	.object({
		categoryId: z.string().nullable().openapi({ description: 'カテゴリID' }),
		categoryName: z.string().openapi({ description: 'カテゴリ名' }),
		categoryColor: z.string().openapi({ description: 'カテゴリ色' }),
		categoryIcon: z.string().nullable().openapi({ description: 'カテゴリアイコン' }),
		totalAmount: z.number().openapi({ description: '合計金額' }),
		transactionCount: z.number().openapi({ description: '取引数' }),
	})
	.openapi('CategoryBreakdown');

const MonthlyBreakdownSchema = z
	.object({
		month: z.number().openapi({ description: '月' }),
		totalAmount: z.number().openapi({ description: '合計金額' }),
	})
	.openapi('MonthlyBreakdown');

const SummaryResponseSchema = z
	.object({
		summary: z.object({
			totalAmount: z.number().openapi({ description: '合計金額' }),
			transactionCount: z.number().openapi({ description: '取引数' }),
		}),
		categoryBreakdown: z.array(CategoryBreakdownSchema).openapi({ description: 'カテゴリ別内訳' }),
		monthlyBreakdown: z.array(MonthlyBreakdownSchema).openapi({ description: '月別内訳' }),
	})
	.openapi('SummaryResponse');

export const getSummaryRoute = createRoute({
	method: 'get',
	path: '/transactions/summary',
	tags: ['Transaction'],
	summary: '取引集計',
	description: '取引データの集計情報を取得します',
	security: [{ Bearer: [] }],
	request: {
		query: z.object({
			year: z.string().optional().openapi({ description: '年 (YYYY)' }),
			month: z.string().optional().openapi({ description: '月 (1-12)' }),
		}),
	},
	responses: {
		200: {
			description: '取得成功',
			content: {
				'application/json': { schema: SummaryResponseSchema },
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

export const reCategorizeRoute = createRoute({
	method: 'post',
	path: '/transactions/re-categorize',
	tags: ['Transaction'],
	summary: '取引再カテゴリ分類',
	description: '現在のルールに基づいて、既存の「その他」カテゴリの取引を再分類します',
	security: [{ Cookie: [] }],
	responses: {
		200: {
			description: '処理成功',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
		},
		401: {
			description: '認証エラー',
			content: {
				'application/json': {
					schema: z.object({ error: z.string() }),
				},
			},
		},
		500: {
			description: 'サーバーエラー',
			content: {
				'application/json': {
					schema: z.object({ error: z.string() }),
				},
			},
		},
	},
});

// 型エクスポート
export type UploadCsvRoute = typeof uploadCsvRoute;
export type GetTransactionsRoute = typeof getTransactionsRoute;
export type GetSummaryRoute = typeof getSummaryRoute;
export type ReCategorizeRoute = typeof reCategorizeRoute;

/**
 * 取引集計 API ハンドラー
 */

import { Context } from 'hono';
import { db } from '@/db';
import { expenses, categories } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export const getTransactionsSummaryHandler = async (c: Context) => {
	const userPayload = c.get('user');

	if (!userPayload || !userPayload.userId) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	try {
		const { year, month } = c.req.query();

		// 期間の条件を構築
		const conditions = [eq(expenses.userId, userPayload.userId)];

		if (year && month) {
			// 指定月のデータ
			const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
			const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
			conditions.push(gte(expenses.transactionDate, startDate));
			conditions.push(lte(expenses.transactionDate, endDate));
		} else if (year) {
			// 指定年のデータ
			const startDate = new Date(parseInt(year), 0, 1);
			const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
			conditions.push(gte(expenses.transactionDate, startDate));
			conditions.push(lte(expenses.transactionDate, endDate));
		}

		// カテゴリ別集計
		const categoryBreakdown = await db
			.select({
				categoryId: expenses.categoryId,
				categoryName: categories.name,
				categoryColor: categories.color,
				categoryIcon: categories.icon,
				totalAmount: sql<number>`sum(${expenses.amount})`,
				transactionCount: sql<number>`count(*)`,
			})
			.from(expenses)
			.leftJoin(categories, eq(expenses.categoryId, categories.id))
			.where(and(...conditions))
			.groupBy(expenses.categoryId, categories.name, categories.color, categories.icon);

		// 月別集計（年を指定した場合）
		let monthlyBreakdown: Array<{ month: number; totalAmount: number }> = [];

		if (year && !month) {
			const monthlyResult = await db
				.select({
					month: sql<number>`extract(month from ${expenses.transactionDate})`,
					totalAmount: sql<number>`sum(${expenses.amount})`,
				})
				.from(expenses)
				.where(and(...conditions))
				.groupBy(sql`extract(month from ${expenses.transactionDate})`);

			monthlyBreakdown = monthlyResult.map((r) => ({
				month: Number(r.month),
				totalAmount: Number(r.totalAmount),
			}));
		}

		// 合計
		const totalResult = await db
			.select({
				totalAmount: sql<number>`sum(${expenses.amount})`,
				transactionCount: sql<number>`count(*)`,
			})
			.from(expenses)
			.where(and(...conditions));

		return c.json({
			summary: {
				totalAmount: Number(totalResult[0]?.totalAmount ?? 0),
				transactionCount: Number(totalResult[0]?.transactionCount ?? 0),
			},
			categoryBreakdown: categoryBreakdown.map((c) => ({
				categoryId: c.categoryId,
				categoryName: c.categoryName ?? 'その他',
				categoryColor: c.categoryColor ?? '#B8B8B8',
				categoryIcon: c.categoryIcon,
				totalAmount: Number(c.totalAmount),
				transactionCount: Number(c.transactionCount),
			})),
			monthlyBreakdown,
		});
	} catch (error) {
		console.error('Get summary error:', error);
		return c.json({ error: 'Internal Server Error' }, 500);
	}
};

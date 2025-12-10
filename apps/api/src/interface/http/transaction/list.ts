/**
 * 取引履歴取得 API ハンドラー
 */

import { Context } from 'hono';
import { db } from '@/db';
import { expenses, categories } from '@/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

export const getTransactionsHandler = async (c: Context) => {
	const userPayload = c.get('user');

	if (!userPayload || !userPayload.userId) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	try {
		const { page = '1', limit = '50', startDate, endDate, categoryId } = c.req.query();

		const pageNum = Math.max(1, parseInt(page, 10));
		const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
		const offset = (pageNum - 1) * limitNum;

		// 条件を構築
		const conditions = [eq(expenses.userId, userPayload.userId)];

		if (startDate) {
			conditions.push(gte(expenses.transactionDate, new Date(startDate)));
		}
		if (endDate) {
			conditions.push(lte(expenses.transactionDate, new Date(endDate)));
		}
		if (categoryId) {
			conditions.push(eq(expenses.categoryId, categoryId));
		}

		// 取引データ取得
		const result = await db
			.select({
				id: expenses.id,
				transactionDate: expenses.transactionDate,
				amount: expenses.amount,
				merchant: expenses.merchant,
				paymentMethod: expenses.paymentMethod,
				categoryId: expenses.categoryId,
				categoryName: categories.name,
				categoryColor: categories.color,
			})
			.from(expenses)
			.leftJoin(categories, eq(expenses.categoryId, categories.id))
			.where(and(...conditions))
			.orderBy(desc(expenses.transactionDate))
			.limit(limitNum)
			.offset(offset);

		// 総件数取得
		const countResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(expenses)
			.where(and(...conditions));

		const totalCount = Number(countResult[0]?.count ?? 0);

		return c.json({
			data: result,
			pagination: {
				page: pageNum,
				limit: limitNum,
				totalCount,
				totalPages: Math.ceil(totalCount / limitNum),
			},
		});
	} catch (error) {
		console.error('Get transactions error:', error);
		return c.json({ error: 'Internal Server Error' }, 500);
	}
};

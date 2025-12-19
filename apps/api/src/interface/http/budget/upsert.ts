import { Context } from 'hono';
import { db } from '@/db';
import { budgets, categories } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const upsertBudgetHandler = async (c: Context) => {
	const userPayload = c.get('user');

	if (!userPayload || !userPayload.userId) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	try {
		const body = await c.req.json();
		const { categoryId, amount, year, month } = body;

		// 1. 既存の予算をチェック
		const existing = await db
			.select()
			.from(budgets)
			.where(and(eq(budgets.userId, userPayload.userId), categoryId ? eq(budgets.categoryId, categoryId) : isNull(budgets.categoryId), eq(budgets.year, year), eq(budgets.month, month)))
			.limit(1);

		let result;
		if (existing.length > 0) {
			// 更新
			[result] = await db
				.update(budgets)
				.set({
					amount,
					updatedAt: new Date(),
				})
				.where(eq(budgets.id, existing[0].id))
				.returning();
		} else {
			// 新規作成
			[result] = await db
				.insert(budgets)
				.values({
					userId: userPayload.userId,
					categoryId,
					amount,
					year,
					month,
				})
				.returning();
		}

		// カテゴリ名を取得
		let categoryName = null;
		if (result.categoryId) {
			const cat = await db.query.categories.findFirst({
				where: eq(categories.id, result.categoryId),
			});
			categoryName = cat?.name ?? null;
		}

		return c.json(
			{
				...result,
				categoryName,
				createdAt: result.createdAt.toISOString(),
				updatedAt: result.updatedAt.toISOString(),
			},
			200
		);
	} catch (error) {
		console.error('Upsert budget error:', error);
		return c.json({ error: 'Internal Server Error' }, 500);
	}
};

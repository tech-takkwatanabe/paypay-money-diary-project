import { Context } from 'hono';
import { db } from '@/db';
import { budgets, categories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const getBudgetsHandler = async (c: Context) => {
	const userPayload = c.get('user');

	if (!userPayload || !userPayload.userId) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	const { year, month } = c.req.query();

	try {
		const result = await db
			.select({
				id: budgets.id,
				userId: budgets.userId,
				categoryId: budgets.categoryId,
				categoryName: categories.name,
				amount: budgets.amount,
				year: budgets.year,
				month: budgets.month,
				createdAt: budgets.createdAt,
				updatedAt: budgets.updatedAt,
			})
			.from(budgets)
			.leftJoin(categories, eq(budgets.categoryId, categories.id))
			.where(and(eq(budgets.userId, userPayload.userId), year ? eq(budgets.year, parseInt(year)) : undefined, month ? eq(budgets.month, parseInt(month)) : undefined));

		// Drizzleの型変換 (Date -> ISO String)
		const formattedResult = result.map((b) => ({
			...b,
			createdAt: b.createdAt.toISOString(),
			updatedAt: b.updatedAt.toISOString(),
		}));

		return c.json({ data: formattedResult }, 200);
	} catch (error) {
		console.error('Get budgets error:', error);
		return c.json({ error: 'Internal Server Error' }, 500);
	}
};

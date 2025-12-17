/**
 * ルール作成 API ハンドラー
 */

import { Context } from 'hono';
import { db } from '@/db';
import { categoryRules, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const createRuleHandler = async (c: Context) => {
	const userPayload = c.get('user');

	if (!userPayload || !userPayload.userId) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	try {
		const body = await c.req.json();
		const { keyword, categoryId, priority = 0 } = body;

		// カテゴリの存在確認
		const category = await db.query.categories.findFirst({
			where: eq(categories.id, categoryId),
		});

		if (!category) {
			return c.json({ error: 'Category not found' }, 400);
		}

		// ルールの作成
		const [newRule] = await db
			.insert(categoryRules)
			.values({
				userId: userPayload.userId,
				keyword,
				categoryId,
				priority,
			})
			.returning();

		return c.json(
			{
				...newRule,
				categoryName: category.name,
				isSystem: false,
			},
			201
		);
	} catch (error) {
		console.error('Create rule error:', error);
		return c.json({ error: 'Internal Server Error' }, 500);
	}
};

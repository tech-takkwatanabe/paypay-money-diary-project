/**
 * カテゴリ一覧取得 API ハンドラー
 */

import { Context } from 'hono';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, or, isNull, asc } from 'drizzle-orm';

export const getCategoriesHandler = async (c: Context) => {
	const userPayload = c.get('user');

	if (!userPayload || !userPayload.userId) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	try {
		// システム共通カテゴリ + ユーザー固有カテゴリを取得
		const result = await db
			.select({
				id: categories.id,
				name: categories.name,
				color: categories.color,
				icon: categories.icon,
				displayOrder: categories.displayOrder,
				isDefault: categories.isDefault,
				isSystem: isNull(categories.userId),
			})
			.from(categories)
			.where(or(isNull(categories.userId), eq(categories.userId, userPayload.userId)))
			.orderBy(asc(categories.displayOrder));

		return c.json({ data: result });
	} catch (error) {
		console.error('Get categories error:', error);
		return c.json({ error: 'Internal Server Error' }, 500);
	}
};

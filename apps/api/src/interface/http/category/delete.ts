/**
 * カテゴリ削除 API ハンドラー
 */

import { Context } from 'hono';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const deleteCategoryHandler = async (c: Context) => {
	const userPayload = c.get('user');

	if (!userPayload || !userPayload.userId) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	const categoryId = c.req.param('id');

	if (!categoryId) {
		return c.json({ error: 'Category ID is required' }, 400);
	}

	try {
		// カテゴリの存在確認と権限チェック
		const existing = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);

		if (existing.length === 0) {
			return c.json({ error: 'Category not found' }, 404);
		}

		const category = existing[0];

		// システムカテゴリ（userId が null）は削除不可
		if (category.userId === null) {
			return c.json({ error: 'Cannot delete system category' }, 403);
		}

		// 他ユーザーのカテゴリは削除不可
		if (category.userId !== userPayload.userId) {
			return c.json({ error: 'Unauthorized' }, 403);
		}

		// 削除実行（expenses の category_id は ON DELETE SET NULL で自動的に null になる）
		await db.delete(categories).where(eq(categories.id, categoryId));

		return c.json({ message: 'Category deleted successfully' });
	} catch (error) {
		console.error('Delete category error:', error);
		return c.json({ error: 'Internal Server Error' }, 500);
	}
};

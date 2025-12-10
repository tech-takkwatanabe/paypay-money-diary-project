/**
 * カテゴリ作成 API ハンドラー
 */

import { Context } from 'hono';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { z } from 'zod';

const CreateCategorySchema = z.object({
	name: z.string().min(1).max(50),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
	icon: z.string().max(50).optional(),
	displayOrder: z.number().int().min(0).optional(),
});

export const createCategoryHandler = async (c: Context) => {
	const userPayload = c.get('user');

	if (!userPayload || !userPayload.userId) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	try {
		const body = await c.req.json();
		const result = CreateCategorySchema.safeParse(body);

		if (!result.success) {
			return c.json({ error: 'Invalid request body', details: result.error.issues }, 400);
		}

		const { name, color, icon, displayOrder } = result.data;

		const [category] = await db
			.insert(categories)
			.values({
				userId: userPayload.userId,
				name,
				color,
				icon: icon ?? null,
				displayOrder: displayOrder ?? 0,
				isDefault: false,
			})
			.returning();

		return c.json(
			{
				id: category.id,
				name: category.name,
				color: category.color,
				icon: category.icon,
				displayOrder: category.displayOrder,
				isDefault: category.isDefault,
			},
			201
		);
	} catch (error) {
		if (error instanceof Error && error.message.includes('unique')) {
			return c.json({ error: 'Category with this name already exists' }, 409);
		}
		console.error('Create category error:', error);
		return c.json({ error: 'Internal Server Error' }, 500);
	}
};

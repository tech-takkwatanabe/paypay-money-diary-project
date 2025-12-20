/**
 * カテゴリ更新 API ハンドラー
 */

import { Context } from "hono";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  icon: z.string().max(50).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const updateCategoryHandler = async (c: Context) => {
  const userPayload = c.get("user");

  if (!userPayload || !userPayload.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const categoryId = c.req.param("id");

  if (!categoryId) {
    return c.json({ error: "Category ID is required" }, 400);
  }

  try {
    // カテゴリの存在確認と権限チェック
    const existing = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Category not found" }, 404);
    }

    const category = existing[0];

    // システムカテゴリ（userId が null）は更新不可
    if (category.userId === null) {
      return c.json({ error: "Cannot modify system category" }, 403);
    }

    // 他ユーザーのカテゴリは更新不可
    if (category.userId !== userPayload.userId) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    const body = await c.req.json();
    const result = UpdateCategorySchema.safeParse(body);

    if (!result.success) {
      return c.json({ error: "Invalid request body", details: result.error.issues }, 400);
    }

    const updates = result.data;

    // 更新するフィールドがない場合
    if (Object.keys(updates).length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    const [updated] = await db.update(categories).set(updates).where(eq(categories.id, categoryId)).returning();

    return c.json({
      id: updated.id,
      name: updated.name,
      color: updated.color,
      icon: updated.icon,
      displayOrder: updated.displayOrder,
      isDefault: updated.isDefault,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("unique")) {
      return c.json({ error: "Category with this name already exists" }, 409);
    }
    console.error("Update category error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

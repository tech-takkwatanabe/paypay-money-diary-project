/**
 * ルール更新 API ハンドラー
 */

import { Context } from "hono";
import { db } from "@/db";
import { categoryRules, categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const updateRuleHandler = async (c: Context) => {
  const userPayload = c.get("user");

  if (!userPayload || !userPayload.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");

  try {
    const body = await c.req.json();
    const { keyword, categoryId, priority } = body;

    // ルールの存在と所有権の確認
    const existingRule = await db.query.categoryRules.findFirst({
      where: and(
        eq(categoryRules.id, id),
        eq(categoryRules.userId, userPayload.userId),
      ),
    });

    if (!existingRule) {
      return c.json({ error: "Rule not found or unauthorized" }, 404);
    }

    // カテゴリの存在確認 (変更する場合)
    let categoryName = "";
    if (categoryId) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, categoryId),
      });
      if (!category) {
        return c.json({ error: "Category not found" }, 400);
      }
      categoryName = category.name;
    } else {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, existingRule.categoryId),
      });
      categoryName = category?.name || "";
    }

    // ルールの更新
    const [updatedRule] = await db
      .update(categoryRules)
      .set({
        keyword: keyword ?? existingRule.keyword,
        categoryId: categoryId ?? existingRule.categoryId,
        priority: priority ?? existingRule.priority,
      })
      .where(eq(categoryRules.id, id))
      .returning();

    return c.json(
      {
        ...updatedRule,
        categoryName,
        isSystem: false,
      },
      200,
    );
  } catch (error) {
    console.error("Update rule error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

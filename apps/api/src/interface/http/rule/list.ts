/**
 * ルール一覧取得 API ハンドラー
 */

import { Context } from "hono";
import { db } from "@/db";
import { categories, categoryRules } from "@/db/schema";
import { eq, or, isNull } from "drizzle-orm";

export const getRulesHandler = async (c: Context) => {
  const userPayload = c.get("user");

  if (!userPayload || !userPayload.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // ユーザー固有のルールとシステム共通ルールを取得
    const rules = await db
      .select({
        id: categoryRules.id,
        keyword: categoryRules.keyword,
        categoryId: categoryRules.categoryId,
        categoryName: categories.name,
        priority: categoryRules.priority,
        userId: categoryRules.userId,
      })
      .from(categoryRules)
      .innerJoin(categories, eq(categoryRules.categoryId, categories.id))
      .where(
        or(
          eq(categoryRules.userId, userPayload.userId),
          isNull(categoryRules.userId),
        ),
      )
      .orderBy(categoryRules.priority, categoryRules.keyword);

    const result = rules.map((rule) => ({
      ...rule,
      isSystem: rule.userId === null,
    }));

    return c.json({ data: result }, 200);
  } catch (error) {
    console.error("Get rules error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

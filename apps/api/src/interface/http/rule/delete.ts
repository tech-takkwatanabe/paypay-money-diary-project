/**
 * ルール削除 API ハンドラー
 */

import { Context } from "hono";
import { db } from "@/db";
import { categoryRules } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const deleteRuleHandler = async (c: Context) => {
  const userPayload = c.get("user");

  if (!userPayload || !userPayload.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");

  try {
    // ルールの存在と所有権の確認
    const existingRule = await db.query.categoryRules.findFirst({
      where: and(eq(categoryRules.id, id), eq(categoryRules.userId, userPayload.userId)),
    });

    if (!existingRule) {
      return c.json({ error: "Rule not found or unauthorized" }, 404);
    }

    // ルールの削除
    await db.delete(categoryRules).where(eq(categoryRules.id, id));

    return c.json({ message: "Rule deleted successfully" }, 200);
  } catch (error) {
    console.error("Delete rule error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

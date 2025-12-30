/**
 * 取引更新 API ハンドラー
 */

import { Context } from "hono";
import { db } from "@/db";
import { expenses, categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const updateTransactionHandler = async (c: Context) => {
  const userPayload = c.get("user");
  const id = c.req.param("id");

  if (!userPayload || !userPayload.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();
    const { categoryId } = body;

    if (!categoryId) {
      return c.json({ error: "categoryId is required" }, 400);
    }

    // 取引の存在と所有権を確認
    const existing = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userPayload.userId)))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Transaction not found" }, 404);
    }

    // 更新実行
    const [updated] = await db
      .update(expenses)
      .set({ categoryId })
      .where(and(eq(expenses.id, id), eq(expenses.userId, userPayload.userId)))
      .returning();

    // カテゴリ情報を結合して返す
    const [result] = await db
      .select({
        id: expenses.id,
        transactionDate: expenses.transactionDate,
        amount: expenses.amount,
        merchant: expenses.merchant,
        paymentMethod: expenses.paymentMethod,
        categoryId: expenses.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(eq(expenses.id, updated.id))
      .limit(1);

    return c.json(
      {
        ...result,
        transactionDate: result.transactionDate.toISOString(),
      },
      200
    );
  } catch (error) {
    console.error("Update transaction error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

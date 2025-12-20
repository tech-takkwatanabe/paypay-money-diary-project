/**
 * 取引再カテゴリ分類 API ハンドラー
 */

import { Context } from "hono";
import { db } from "@/db";
import { expenses, categoryRules, categories } from "@/db/schema";
import { eq, or, isNull, sql } from "drizzle-orm";

export const reCategorizeHandler = async (c: Context) => {
  const userPayload = c.get("user");

  if (!userPayload || !userPayload.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // 1. ユーザーのルールとシステムルールを取得 (優先度順)
    const rules = await db
      .select({
        keyword: categoryRules.keyword,
        categoryId: categoryRules.categoryId,
      })
      .from(categoryRules)
      .where(
        or(
          eq(categoryRules.userId, userPayload.userId),
          isNull(categoryRules.userId),
        ),
      )
      .orderBy(categoryRules.priority, categoryRules.keyword);

    if (rules.length === 0) {
      return c.json({ message: "No rules found", updatedCount: 0 });
    }

    // 2. 「その他」カテゴリのIDを取得
    const otherCategory = await db.query.categories.findFirst({
      where: eq(categories.name, "その他"),
    });

    if (!otherCategory) {
      return c.json({ error: 'Default category "その他" not found' }, 500);
    }

    // 3. 各ルールを適用
    // 本来はSQL一発でやりたいが、キーワードマッチングがあるのでループで回すか、複雑なCASE文を構築する
    // ここではシンプルにループで回して更新する (データ量が多くなければ許容範囲)
    for (const rule of rules) {
      await db
        .update(expenses)
        .set({ categoryId: rule.categoryId })
        .where(
          sql`${expenses.userId} = ${userPayload.userId} AND 
              (${expenses.categoryId} = ${otherCategory.id} OR ${expenses.categoryId} IS NULL) AND 
              ${expenses.merchant} LIKE ${"%" + rule.keyword + "%"}`,
        );

      // Drizzleのupdateは戻り値がドライバに依存するが、postgresドライバなら結果が返る
      // rowCountを取得したい場合は .returning() を使うか、直接SQLを実行する
    }

    // 正確な件数を取得するために、更新後の状態を確認するか、returningを使う
    // 今回は簡易的に「処理完了」を返す

    return c.json({ message: "Re-categorization completed" }, 200);
  } catch (error) {
    console.error("Re-categorize error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

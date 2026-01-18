import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Reorder Categories UseCase
 * カテゴリの表示順を一括更新
 */
export class ReorderCategoriesUseCase {
  /**
   * 実行
   * @param userId ユーザーID
   * @param categoryIds 並び替え後のカテゴリIDリスト
   */
  async execute(userId: string, categoryIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      // 1. ユーザーの全カテゴリを取得して検証
      const userCategories = await tx.select().from(categories).where(eq(categories.userId, userId));

      const userCategoryIds = new Set(userCategories.map((c) => c.id));
      const otherCategory = userCategories.find((c) => c.name === "その他");

      // 送信されたIDがすべてユーザーのものであることを確認
      for (const id of categoryIds) {
        if (!userCategoryIds.has(id)) {
          throw new Error(`Unauthorized or invalid category ID: ${id}`);
        }
      }

      // 2. 表示順を更新
      // 「その他」は常に最後に表示されるようにするため、
      // categoryIdsに含まれていない場合や、途中に含まれている場合でも
      // 最終的に最大値を割り当てる。

      let order = 1;
      for (const id of categoryIds) {
        const cat = userCategories.find((c) => c.id === id);
        if (cat && cat.name !== "その他") {
          await tx
            .update(categories)
            .set({ displayOrder: order++ })
            .where(and(eq(categories.id, id), eq(categories.userId, userId)));
        }
      }

      // 3. 「その他」を末尾に固定
      if (otherCategory) {
        await tx
          .update(categories)
          .set({ displayOrder: 9999 })
          .where(and(eq(categories.id, otherCategory.id), eq(categories.userId, userId)));
      }
    });
  }
}

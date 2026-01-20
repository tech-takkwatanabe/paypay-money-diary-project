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
      const otherCategory = userCategories.find((c) => c.isOther);

      // 送信されたIDがすべてユーザーのものであることを確認
      for (const id of categoryIds) {
        if (!userCategoryIds.has(id)) {
          throw new Error(`Unauthorized or invalid category ID: ${id}`);
        }
      }

      // 重複チェック
      const uniqueIds = new Set(categoryIds);
      if (uniqueIds.size !== categoryIds.length) {
        throw new Error("Duplicate category IDs in reorder request");
      }

      // 「その他」がリストに含まれていないかチェック
      if (otherCategory && uniqueIds.has(otherCategory.id)) {
        throw new Error("Cannot reorder 'Others' category - it must always be at the end");
      }

      // 「その他」以外のカテゴリがすべて含まれているか確認
      const reorderableIdSet = new Set(userCategories.filter((c) => !c.isOther).map((c) => c.id));
      if (![...reorderableIdSet].every((id) => uniqueIds.has(id))) {
        // Note: The requirement is that we reorder the provided IDs.
        // If some categories are missing from the input, their order won't be updated.
        // However, the review comment suggested: "Reorder list must include all categories except 'その他'".
        // Let's implement strict validation as suggested.
        throw new Error("Reorder list must include all categories except 'Others'");
      }

      // 2. 表示順を更新
      // 「その他」は常に最後に表示されるようにするため、
      // categoryIdsに含まれていない場合や、途中に含まれている場合でも
      // 最終的に最大値を割り当てる。

      const now = new Date();
      let order = 1;
      for (const id of categoryIds) {
        const cat = userCategories.find((c) => c.id === id);
        if (cat && !cat.isOther) {
          await tx
            .update(categories)
            .set({ displayOrder: order++, updatedAt: now })
            .where(and(eq(categories.id, id), eq(categories.userId, userId)));
        }
      }

      // 3. 「その他」を末尾に固定
      if (otherCategory) {
        await tx
          .update(categories)
          .set({ displayOrder: 9999, updatedAt: now })
          .where(and(eq(categories.id, otherCategory.id), eq(categories.userId, userId)));
      }
    });
  }
}

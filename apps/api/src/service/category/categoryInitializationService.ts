import { db } from "@/db";
import { defaultCategories, defaultCategoryRules, categories, categoryRules } from "@/db/schema";

/**
 * Category Initialization Service
 * 新規ユーザー向けにデフォルトカテゴリとルールをコピーして初期化する
 */
export class CategoryInitializationService {
  /**
   * ユーザーのカテゴリとルールを初期化
   * @param userId ユーザーのUUID
   */
  async initializeForUser(userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // 1. デフォルトカテゴリを取得
      const defaults = await tx.select().from(defaultCategories);

      // 2. ユーザー用カテゴリとしてコピー
      // カテゴリ名から新しいIDへのマッピングを保持（ルールの紐付け用）
      const categoryIdMap = new Map<string, string>();

      for (const df of defaults) {
        const [newCategory] = await tx
          .insert(categories)
          .values({
            userId,
            name: df.name,
            color: df.color,
            icon: df.icon,
            displayOrder: df.displayOrder,
            isDefault: df.isDefault,
          })
          .returning();

        categoryIdMap.set(df.id, newCategory.id);
      }

      // 3. デフォルトルールを取得
      const defaultRules = await tx.select().from(defaultCategoryRules);

      // 4. ユーザー用ルールとしてコピー
      for (const dr of defaultRules) {
        const newCategoryId = categoryIdMap.get(dr.defaultCategoryId);
        if (newCategoryId) {
          await tx.insert(categoryRules).values({
            userId,
            keyword: dr.keyword,
            categoryId: newCategoryId,
            priority: dr.priority,
          });
        }
      }
    });
  }
}

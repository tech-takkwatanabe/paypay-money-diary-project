import { eq } from "drizzle-orm";
import { db } from "@/db";
import { defaultCategoryRules } from "@/db/schema";
import { IDefaultCategoryRuleRepository } from "@/domain/repository/defaultCategoryRuleRepository";

/**
 * Default Category Rule Repository Implementation
 * デフォルトカテゴリルールのデータアクセス実装
 */
export class DefaultCategoryRuleRepository implements IDefaultCategoryRuleRepository {
  /**
   * すべてのデフォルトカテゴリルールを取得
   */
  async findAll(): Promise<Array<{ id: string; keyword: string; defaultCategoryId: string; priority: number }>> {
    const results = await db.select().from(defaultCategoryRules).orderBy(defaultCategoryRules.priority);

    return results.map((row) => ({
      id: row.id,
      keyword: row.keyword,
      defaultCategoryId: row.defaultCategoryId,
      priority: row.priority,
    }));
  }

  /**
   * デフォルトカテゴリルールをIDで検索
   */
  async findById(
    id: string
  ): Promise<{ id: string; keyword: string; defaultCategoryId: string; priority: number } | null> {
    const results = await db.select().from(defaultCategoryRules).where(eq(defaultCategoryRules.id, id)).limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      id: row.id,
      keyword: row.keyword,
      defaultCategoryId: row.defaultCategoryId,
      priority: row.priority,
    };
  }

  /**
   * カテゴリIDに関連するデフォルトルールを取得
   */
  async findByCategoryId(
    categoryId: string
  ): Promise<Array<{ id: string; keyword: string; defaultCategoryId: string; priority: number }>> {
    const results = await db
      .select()
      .from(defaultCategoryRules)
      .where(eq(defaultCategoryRules.defaultCategoryId, categoryId))
      .orderBy(defaultCategoryRules.priority);

    return results.map((row) => ({
      id: row.id,
      keyword: row.keyword,
      defaultCategoryId: row.defaultCategoryId,
      priority: row.priority,
    }));
  }
}

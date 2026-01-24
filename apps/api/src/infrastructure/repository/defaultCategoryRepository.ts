import { eq } from "drizzle-orm";
import { db } from "@/db";
import { defaultCategories } from "@/db/schema";
import { IDefaultCategoryRepository } from "@/domain/repository/defaultCategoryRepository";

/**
 * Default Category Repository Implementation
 * デフォルトカテゴリのデータアクセス実装
 */
export class DefaultCategoryRepository implements IDefaultCategoryRepository {
  /**
   * すべてのデフォルトカテゴリを取得
   */
  async findAll(): Promise<
    Array<{
      id: string;
      name: string;
      color: string;
      icon: string | null;
      displayOrder: number;
      isDefault: boolean;
      isOther: boolean;
    }>
  > {
    const results = await db.select().from(defaultCategories).orderBy(defaultCategories.displayOrder);

    return results.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      displayOrder: row.displayOrder,
      isDefault: row.isDefault,
      isOther: row.isOther,
    }));
  }

  /**
   * デフォルトカテゴリをIDで検索
   */
  async findById(id: string): Promise<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
    displayOrder: number;
    isDefault: boolean;
    isOther: boolean;
  } | null> {
    const results = await db.select().from(defaultCategories).where(eq(defaultCategories.id, id)).limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      displayOrder: row.displayOrder,
      isDefault: row.isDefault,
      isOther: row.isOther,
    };
  }
}

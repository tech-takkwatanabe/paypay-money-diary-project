import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { categories, categoryRules, expenses } from "@/db/schema";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Category } from "@/domain/entity/category";
import { CreateCategoryInput, UpdateCategoryInput } from "@paypay-money-diary/shared";

/**
 * Category Repository Implementation
 * カテゴリのデータアクセス実装
 */
export class CategoryRepository implements ICategoryRepository {
  /**
   * ユーザーIDでカテゴリを検索
   */
  async findByUserId(userId: string): Promise<Category[]> {
    const results = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.displayOrder);

    // カテゴリに関連するルールを取得して、hasRules フラグを設定
    const rules = await db
      .select({ categoryId: categoryRules.categoryId })
      .from(categoryRules)
      .where(eq(categoryRules.userId, userId));

    const categoryIdsWithRules = new Set(rules.map((r) => r.categoryId));

    // カテゴリに関連する支出を取得して、hasTransactions フラグを設定
    // expensesテーブルから、このユーザーの支出で使用されているカテゴリIDを取得
    const expensesList = await db
      .select({ categoryId: expenses.categoryId })
      .from(expenses)
      .where(eq(expenses.userId, userId));

    const categoryIdsWithTransactions = new Set(
      expensesList.map((e) => e.categoryId).filter((id): id is string => id !== null)
    );

    return results.map(
      (row) =>
        new Category(
          row.id,
          row.name,
          row.color,
          row.icon,
          row.displayOrder,
          row.isDefault,
          row.userId,
          row.createdAt ?? undefined,
          row.updatedAt ?? undefined,
          categoryIdsWithRules.has(row.id),
          categoryIdsWithTransactions.has(row.id)
        )
    );
  }

  /**
   * IDでカテゴリを検索
   */
  async findById(id: string): Promise<Category | null> {
    const results = await db.select().from(categories).where(eq(categories.id, id)).limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return new Category(
      row.id,
      row.name,
      row.color,
      row.icon,
      row.displayOrder,
      row.isDefault,
      row.userId,
      row.createdAt ?? undefined,
      row.updatedAt ?? undefined
    );
  }

  /**
   * ユーザーIDと名前でカテゴリを検索
   */
  async findByName(userId: string, name: string): Promise<Category | null> {
    const results = await db
      .select()
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.name, name)))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return new Category(
      row.id,
      row.name,
      row.color,
      row.icon,
      row.displayOrder,
      row.isDefault,
      row.userId,
      row.createdAt ?? undefined,
      row.updatedAt ?? undefined
    );
  }

  /**
   * カテゴリを作成
   */
  async create(userId: string, input: CreateCategoryInput): Promise<Category> {
    const results = await db
      .insert(categories)
      .values({
        userId,
        name: input.name,
        color: input.color,
        icon: input.icon ?? null,
        displayOrder: input.displayOrder ?? 0,
        isDefault: false,
      })
      .returning();

    const row = results[0];
    return new Category(
      row.id,
      row.name,
      row.color,
      row.icon,
      row.displayOrder,
      row.isDefault,
      row.userId,
      row.createdAt ?? undefined,
      row.updatedAt ?? undefined
    );
  }

  /**
   * カテゴリを更新
   */
  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;

    const results = await db.update(categories).set(updateData).where(eq(categories.id, id)).returning();

    const row = results[0];
    return new Category(
      row.id,
      row.name,
      row.color,
      row.icon,
      row.displayOrder,
      row.isDefault,
      row.userId,
      row.createdAt ?? undefined,
      undefined
    );
  }

  /**
   * カテゴリを削除
   */
  async delete(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }
}

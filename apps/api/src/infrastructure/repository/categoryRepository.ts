import { eq, and, isNotNull } from "drizzle-orm";
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
      .selectDistinct({ categoryId: expenses.categoryId })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), isNotNull(expenses.categoryId)));

    const categoryIdsWithTransactions = new Set(expensesList.map((e) => e.categoryId as string));

    return results.map(
      (row) =>
        new Category({
          id: row.id,
          name: row.name,
          color: row.color,
          icon: row.icon,
          displayOrder: row.displayOrder,
          isDefault: row.isDefault,
          isOther: row.isOther,
          userId: row.userId,
          createdAt: row.createdAt ?? undefined,
          updatedAt: row.updatedAt ?? undefined,
          hasRules: categoryIdsWithRules.has(row.id),
          hasTransactions: categoryIdsWithTransactions.has(row.id),
        })
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

    // hasRules check
    const rules = await db
      .select({ id: categoryRules.id })
      .from(categoryRules)
      .where(eq(categoryRules.categoryId, id))
      .limit(1);
    const hasRules = rules.length > 0;

    // hasTransactions check
    const transactions = await db
      .select({ id: expenses.id })
      .from(expenses)
      .where(eq(expenses.categoryId, id))
      .limit(1);
    const hasTransactions = transactions.length > 0;

    return new Category({
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      displayOrder: row.displayOrder,
      isDefault: row.isDefault,
      isOther: row.isOther,
      userId: row.userId,
      createdAt: row.createdAt ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
      hasRules,
      hasTransactions,
    });
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

    // hasRules check
    const rules = await db
      .select({ id: categoryRules.id })
      .from(categoryRules)
      .where(eq(categoryRules.categoryId, row.id))
      .limit(1);
    const hasRules = rules.length > 0;

    // hasTransactions check
    const transactions = await db
      .select({ id: expenses.id })
      .from(expenses)
      .where(eq(expenses.categoryId, row.id))
      .limit(1);
    const hasTransactions = transactions.length > 0;

    return new Category({
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      displayOrder: row.displayOrder,
      isDefault: row.isDefault,
      isOther: row.isOther,
      userId: row.userId,
      createdAt: row.createdAt ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
      hasRules,
      hasTransactions,
    });
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
    return new Category({
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      displayOrder: row.displayOrder,
      isDefault: row.isDefault,
      isOther: row.isOther,
      userId: row.userId,
      createdAt: row.createdAt ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
    });
  }

  /**
   * カテゴリを更新
   */
  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;

    const results = await db.update(categories).set(updateData).where(eq(categories.id, id)).returning();

    const row = results[0];
    return new Category({
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      displayOrder: row.displayOrder,
      isDefault: row.isDefault,
      isOther: row.isOther,
      userId: row.userId,
      createdAt: row.createdAt ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
    });
  }

  /**
   * カテゴリを削除
   */
  async delete(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }
}

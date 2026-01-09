import { eq, and, sql, gte, lt, desc, ilike } from "drizzle-orm";
import { db } from "@/db";
import { expenses, categories, categoryRules } from "@/db/schema";
import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { Transaction } from "@/domain/entity/transaction";
import { UpdateTransactionInput } from "@paypay-money-diary/shared";

/**
 * Transaction Repository Implementation
 * トランザクションのデータアクセス実装
 */
export class TransactionRepository implements ITransactionRepository {
  /**
   * ユーザーIDでトランザクションを検索
   */
  async findByUserId(
    userId: string,
    options?: {
      year?: number;
      month?: number;
      categoryId?: string;
      search?: string;
      pagination?: {
        page: number;
        limit: number;
      };
    }
  ): Promise<Transaction[]> {
    const conditions = [eq(expenses.userId, userId)];

    // 年月でフィルタ
    if (options?.month && options?.year) {
      const startDate = new Date(options.year, options.month - 1, 1);
      const endDate = new Date(options.year, options.month, 1);
      conditions.push(gte(expenses.transactionDate, startDate), lt(expenses.transactionDate, endDate));
    } else if (options?.year) {
      const startDate = new Date(options.year, 0, 1);
      const endDate = new Date(options.year + 1, 0, 1);
      conditions.push(gte(expenses.transactionDate, startDate), lt(expenses.transactionDate, endDate));
    }

    // カテゴリでフィルタ
    if (options?.categoryId) {
      conditions.push(eq(expenses.categoryId, options.categoryId));
    }

    // 検索ワードでフィルタ
    if (options?.search) {
      conditions.push(ilike(expenses.merchant, `%${options.search}%`));
    }

    let query = db
      .select({
        id: expenses.id,
        userId: expenses.userId,
        date: expenses.transactionDate,
        description: expenses.merchant,
        amount: expenses.amount,
        categoryId: expenses.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(and(...conditions))
      .$dynamic();

    // ページネーション
    if (options?.pagination) {
      const offset = (options.pagination.page - 1) * options.pagination.limit;
      query = query.limit(options.pagination.limit).offset(offset);
    }

    const results = await query.orderBy(desc(expenses.transactionDate));

    return results.map(
      (row) =>
        new Transaction(
          row.id,
          row.userId,
          row.date,
          row.description,
          row.amount,
          row.categoryId ?? "",
          row.categoryName ?? "未分類",
          row.categoryColor ?? "#CCCCCC",
          row.createdAt ?? undefined,
          undefined
        )
    );
  }

  /**
   * IDでトランザクションを検索
   */
  async findById(id: string): Promise<Transaction | null> {
    const results = await db
      .select({
        id: expenses.id,
        userId: expenses.userId,
        date: expenses.transactionDate,
        description: expenses.merchant,
        amount: expenses.amount,
        categoryId: expenses.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(eq(expenses.id, id))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return new Transaction(
      row.id,
      row.userId,
      row.date,
      row.description,
      row.amount,
      row.categoryId ?? "",
      row.categoryName ?? "未分類",
      row.categoryColor ?? "#CCCCCC",
      row.createdAt ?? undefined,
      undefined
    );
  }

  /**
   * 条件に一致するトランザクションの総件数を取得
   */
  async countByUserId(
    userId: string,
    options?: {
      year?: number;
      month?: number;
      categoryId?: string;
      search?: string;
    }
  ): Promise<number> {
    const conditions = [eq(expenses.userId, userId)];

    if (options?.month && options?.year) {
      const startDate = new Date(options.year, options.month - 1, 1);
      const endDate = new Date(options.year, options.month, 1);
      conditions.push(gte(expenses.transactionDate, startDate), lt(expenses.transactionDate, endDate));
    } else if (options?.year) {
      const startDate = new Date(options.year, 0, 1);
      const endDate = new Date(options.year + 1, 0, 1);
      conditions.push(gte(expenses.transactionDate, startDate), lt(expenses.transactionDate, endDate));
    }

    if (options?.categoryId) {
      conditions.push(eq(expenses.categoryId, options.categoryId));
    }

    if (options?.search) {
      conditions.push(ilike(expenses.merchant, `%${options.search}%`));
    }

    const results = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenses)
      .where(and(...conditions));

    return Number(results[0]?.count ?? 0);
  }

  /**
   * 条件に一致するトランザクションの総額を取得
   */
  async sumByUserId(
    userId: string,
    options?: {
      year?: number;
      month?: number;
      categoryId?: string;
      search?: string;
    }
  ): Promise<number> {
    const conditions = [eq(expenses.userId, userId)];

    if (options?.month && options?.year) {
      const startDate = new Date(options.year, options.month - 1, 1);
      const endDate = new Date(options.year, options.month, 1);
      conditions.push(gte(expenses.transactionDate, startDate), lt(expenses.transactionDate, endDate));
    } else if (options?.year) {
      const startDate = new Date(options.year, 0, 1);
      const endDate = new Date(options.year + 1, 0, 1);
      conditions.push(gte(expenses.transactionDate, startDate), lt(expenses.transactionDate, endDate));
    }

    if (options?.categoryId) {
      conditions.push(eq(expenses.categoryId, options.categoryId));
    }

    if (options?.search) {
      conditions.push(ilike(expenses.merchant, `%${options.search}%`));
    }

    const results = await db
      .select({ sum: sql<number>`sum(${expenses.amount})` })
      .from(expenses)
      .where(and(...conditions));

    return Number(results[0]?.sum ?? 0);
  }

  /**
   * トランザクションを作成
   */
  async create(transaction: {
    userId: string;
    date: Date;
    description: string;
    amount: number;
    categoryId: string;
    categoryName: string;
    categoryColor: string;
  }): Promise<Transaction> {
    const results = await db
      .insert(expenses)
      .values({
        userId: transaction.userId,
        transactionDate: transaction.date,
        merchant: transaction.description,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
      })
      .returning();

    const row = results[0];
    return new Transaction(
      row.id,
      row.userId,
      row.transactionDate,
      row.merchant,
      row.amount,
      transaction.categoryId,
      transaction.categoryName,
      transaction.categoryColor,
      row.createdAt ?? undefined,
      undefined
    );
  }

  /**
   * トランザクションを更新
   */
  async update(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    // カテゴリ情報を取得
    const category = await db.select().from(categories).where(eq(categories.id, input.categoryId)).limit(1);

    if (category.length === 0) {
      throw new Error("Category not found");
    }

    const results = await db
      .update(expenses)
      .set({
        categoryId: input.categoryId,
      })
      .where(eq(expenses.id, id))
      .returning();

    const row = results[0];
    return new Transaction(
      row.id,
      row.userId,
      row.transactionDate,
      row.merchant,
      row.amount,
      input.categoryId,
      category[0].name,
      category[0].color,
      row.createdAt ?? undefined,
      undefined
    );
  }

  /**
   * トランザクションを削除
   */
  async delete(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  /**
   * ユーザーの利用可能な年度を取得
   */
  async getAvailableYears(userId: string): Promise<number[]> {
    const results = await db
      .selectDistinct({
        year: sql<number>`EXTRACT(YEAR FROM ${expenses.transactionDate})`,
      })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(sql`EXTRACT(YEAR FROM ${expenses.transactionDate}) DESC`);

    return results.map((row) => row.year);
  }

  /**
   * 指定された年月のトランザクションのカテゴリを再分類
   */
  async reCategorizeByRules(userId: string, year: number, month?: number): Promise<number> {
    // ルールを取得
    const rules = await db
      .select()
      .from(categoryRules)
      .where(eq(categoryRules.userId, userId))
      .orderBy(categoryRules.priority);

    if (rules.length === 0) {
      return 0;
    }

    // 対象のトランザクションを取得
    const startDate = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
    const endDate = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1);

    const transactions = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.transactionDate, startDate),
          lt(expenses.transactionDate, endDate)
        )
      );

    let updatedCount = 0;

    // 各トランザクションにルールを適用
    for (const transaction of transactions) {
      for (const rule of rules) {
        if (transaction.merchant.toLowerCase().includes(rule.keyword.toLowerCase())) {
          await db.update(expenses).set({ categoryId: rule.categoryId }).where(eq(expenses.id, transaction.id));
          updatedCount++;
          break; // 最初にマッチしたルールを適用
        }
      }
    }

    return updatedCount;
  }

  /**
   * 複数のトランザクションを一括作成
   */
  async createMany(
    transactions: Array<{
      userId: string;
      date: Date;
      description: string;
      amount: number;
      categoryId: string;
      categoryName: string;
      categoryColor: string;
    }>
  ): Promise<Transaction[]> {
    if (transactions.length === 0) {
      return [];
    }

    const values = transactions.map((t) => ({
      userId: t.userId,
      transactionDate: t.date,
      merchant: t.description,
      amount: t.amount,
      categoryId: t.categoryId,
    }));

    const results = await db.insert(expenses).values(values).returning();

    return results.map(
      (row, index) =>
        new Transaction(
          row.id,
          row.userId,
          row.transactionDate,
          row.merchant,
          row.amount,
          transactions[index].categoryId,
          transactions[index].categoryName,
          transactions[index].categoryColor,
          row.createdAt ?? undefined,
          undefined
        )
    );
  }

  /**
   * 外部取引IDでトランザクションが存在するか確認
   */
  async existsByExternalId(userId: string, externalId: string): Promise<boolean> {
    const results = await db
      .select({ id: expenses.id })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), eq(expenses.externalTransactionId, externalId)))
      .limit(1);

    return results.length > 0;
  }
}

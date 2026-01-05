import { eq, or, isNull } from "drizzle-orm";
import { db } from "@/db";
import { categoryRules, categories } from "@/db/schema";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { Rule } from "@/domain/entity/rule";
import { CreateRuleInput, UpdateRuleInput } from "@paypay-money-diary/shared";

/**
 * Rule Repository Implementation
 * ルールのデータアクセス実装
 */
export class RuleRepository implements IRuleRepository {
  /**
   * ユーザーIDでルールを検索（優先度順）
   */
  async findByUserId(userId: string): Promise<Rule[]> {
    const results = await db
      .select({
        id: categoryRules.id,
        userId: categoryRules.userId,
        keyword: categoryRules.keyword,
        categoryId: categoryRules.categoryId,
        priority: categoryRules.priority,
        createdAt: categoryRules.createdAt,
        categoryName: categories.name,
      })
      .from(categoryRules)
      .leftJoin(categories, eq(categoryRules.categoryId, categories.id))
      .where(or(eq(categoryRules.userId, userId), isNull(categoryRules.userId)))
      .orderBy(categoryRules.priority, categoryRules.keyword);

    return results.map(
      (row) =>
        new Rule(
          row.id,
          row.userId,
          row.keyword,
          row.categoryId,
          row.priority,
          row.createdAt ?? undefined,
          undefined,
          row.categoryName
        )
    );
  }

  /**
   * IDでルールを検索
   */
  async findById(id: string): Promise<Rule | null> {
    const results = await db
      .select({
        id: categoryRules.id,
        userId: categoryRules.userId,
        keyword: categoryRules.keyword,
        categoryId: categoryRules.categoryId,
        priority: categoryRules.priority,
        createdAt: categoryRules.createdAt,
        categoryName: categories.name,
      })
      .from(categoryRules)
      .leftJoin(categories, eq(categoryRules.categoryId, categories.id))
      .where(eq(categoryRules.id, id))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return new Rule(
      row.id,
      row.userId,
      row.keyword,
      row.categoryId,
      row.priority,
      row.createdAt ?? undefined,
      undefined,
      row.categoryName
    );
  }

  /**
   * ルールを作成
   */
  async create(userId: string, input: CreateRuleInput): Promise<Rule> {
    const insertResults = await db
      .insert(categoryRules)
      .values({
        userId,
        keyword: input.keyword,
        categoryId: input.categoryId,
        priority: input.priority ?? 0,
      })
      .returning();

    const newRow = insertResults[0];
    // カテゴリ名を含めて再取得
    const rule = await this.findById(newRow.id);
    if (!rule) throw new Error("Failed to create rule");
    return rule;
  }

  /**
   * ルールを更新
   */
  async update(id: string, input: UpdateRuleInput): Promise<Rule> {
    const updateData: Record<string, unknown> = {};

    if (input.keyword !== undefined) updateData.keyword = input.keyword;
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
    if (input.priority !== undefined) updateData.priority = input.priority;

    await db.update(categoryRules).set(updateData).where(eq(categoryRules.id, id));

    // カテゴリ名を含めて再取得
    const rule = await this.findById(id);
    if (!rule) throw new Error("Rule not found after update");
    return rule;
  }

  /**
   * ルールを削除
   */
  async delete(id: string): Promise<void> {
    await db.delete(categoryRules).where(eq(categoryRules.id, id));
  }
}

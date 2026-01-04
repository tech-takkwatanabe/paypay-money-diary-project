import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categoryRules } from "@/db/schema";
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
      .select()
      .from(categoryRules)
      .where(eq(categoryRules.userId, userId))
      .orderBy(categoryRules.priority);

    return results.map(
      (row) =>
        new Rule(
          row.id,
          row.userId!,
          row.keyword,
          row.categoryId,
          row.priority,
          row.createdAt ?? undefined,
          undefined // updatedAt is not in the schema
        )
    );
  }

  /**
   * IDでルールを検索
   */
  async findById(id: string): Promise<Rule | null> {
    const results = await db.select().from(categoryRules).where(eq(categoryRules.id, id)).limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return new Rule(
      row.id,
      row.userId!,
      row.keyword,
      row.categoryId,
      row.priority,
      row.createdAt ?? undefined,
      undefined
    );
  }

  /**
   * ルールを作成
   */
  async create(userId: string, input: CreateRuleInput): Promise<Rule> {
    const results = await db
      .insert(categoryRules)
      .values({
        userId,
        keyword: input.keyword,
        categoryId: input.categoryId,
        priority: input.priority ?? 0,
      })
      .returning();

    const row = results[0];
    return new Rule(
      row.id,
      row.userId!,
      row.keyword,
      row.categoryId,
      row.priority,
      row.createdAt ?? undefined,
      undefined
    );
  }

  /**
   * ルールを更新
   */
  async update(id: string, input: UpdateRuleInput): Promise<Rule> {
    const updateData: Record<string, unknown> = {};

    if (input.keyword !== undefined) updateData.keyword = input.keyword;
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
    if (input.priority !== undefined) updateData.priority = input.priority;

    const results = await db.update(categoryRules).set(updateData).where(eq(categoryRules.id, id)).returning();

    const row = results[0];
    return new Rule(
      row.id,
      row.userId!,
      row.keyword,
      row.categoryId,
      row.priority,
      row.createdAt ?? undefined,
      undefined
    );
  }

  /**
   * ルールを削除
   */
  async delete(id: string): Promise<void> {
    await db.delete(categoryRules).where(eq(categoryRules.id, id));
  }
}

/**
 * カテゴリ自動分類サービス
 * キーワードマッチングによりカテゴリを自動判定
 */

import { db } from "@/db";
import { categories, categoryRules } from "@/db/schema";
import { eq, isNull, or, desc } from "drizzle-orm";

export type CategoryRule = {
  keyword: string;
  categoryId: string;
  priority: number;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
};

/**
 * ユーザーのカテゴリルールを取得（システム共通 + ユーザー固有）
 */
export const getCategoryRules = async (userId: string): Promise<CategoryRule[]> => {
  const rules = await db
    .select({
      keyword: categoryRules.keyword,
      categoryId: categoryRules.categoryId,
      priority: categoryRules.priority,
    })
    .from(categoryRules)
    .where(or(isNull(categoryRules.userId), eq(categoryRules.userId, userId)))
    .orderBy(desc(categoryRules.priority));

  return rules;
};

/**
 * 「その他」カテゴリのIDを取得
 */
export const getDefaultCategoryId = async (): Promise<string | null> => {
  const result = await db.select({ id: categories.id }).from(categories).where(eq(categories.name, "その他")).limit(1);

  return result[0]?.id ?? null;
};

/**
 * 取引先名からカテゴリを推定
 */
export const matchCategory = (merchant: string, rules: CategoryRule[]): string | null => {
  const lowerMerchant = merchant.toLowerCase();

  for (const rule of rules) {
    if (lowerMerchant.includes(rule.keyword.toLowerCase())) {
      return rule.categoryId;
    }
  }

  return null;
};

/**
 * 複数の支出データにカテゴリを割り当て
 */
export const assignCategories = async (
  expenses: Array<{ merchant: string }>,
  userId: string
): Promise<Map<string, string | null>> => {
  const rules = await getCategoryRules(userId);
  const defaultCategoryId = await getDefaultCategoryId();

  const result = new Map<string, string | null>();

  for (const expense of expenses) {
    const categoryId = matchCategory(expense.merchant, rules);
    result.set(expense.merchant, categoryId ?? defaultCategoryId);
  }

  return result;
};

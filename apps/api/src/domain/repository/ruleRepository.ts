import { Rule } from "@/domain/entity/rule";
import { CreateRuleInput, UpdateRuleInput } from "@paypay-money-diary/shared";

/**
 * Rule Repository Interface
 * ルールのデータアクセスを抽象化
 */
export interface IRuleRepository {
  /**
   * ユーザーIDでルールを検索（優先度順）
   */
  findByUserId(userId: string): Promise<Rule[]>;

  /**
   * IDでルールを検索
   */
  findById(id: string): Promise<Rule | null>;

  /**
   * カテゴリIDでルールを検索
   */
  findByCategoryId(categoryId: string, userId: string): Promise<Rule[]>;

  /**
   * ルールを作成
   */
  create(userId: string, input: CreateRuleInput): Promise<Rule>;

  /**
   * ルールを更新
   */
  update(id: string, input: UpdateRuleInput): Promise<Rule>;

  /**
   * ルールを削除
   */
  delete(id: string): Promise<void>;
}

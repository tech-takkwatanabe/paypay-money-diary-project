import { IRuleRepository } from "@/domain/repository/ruleRepository";

/**
 * Rule Service
 * ルールに関連する共通ロジックと権限チェック
 */
export class RuleService {
  constructor(private readonly ruleRepository: IRuleRepository) {}

  /**
   * ユーザーがルールにアクセスできるか確認
   * 自分のルールまたはシステムルールであればアクセス可能
   */
  async ensureUserCanAccess(ruleId: string, userId: string): Promise<void> {
    const rule = await this.ruleRepository.findById(ruleId);
    if (!rule) {
      throw new Error("Rule not found");
    }

    if (rule.userId !== null && rule.userId !== userId) {
      throw new Error("Forbidden: You do not have access to this rule");
    }
  }

  /**
   * ユーザーがルールを更新できるか確認
   * 自分のルールのみ更新可能（システムルールは不可）
   */
  async ensureUserCanUpdate(ruleId: string, userId: string): Promise<void> {
    const rule = await this.ruleRepository.findById(ruleId);
    if (!rule) {
      throw new Error("Rule not found");
    }

    if (rule.userId !== null && rule.userId !== userId) {
      throw new Error("Forbidden: You do not have permission to update this rule");
    }
  }

  /**
   * ユーザーがルールを削除できるか確認
   * 自分のルールのみ削除可能（システムルールは不可）
   */
  async ensureUserCanDelete(ruleId: string, userId: string): Promise<void> {
    const rule = await this.ruleRepository.findById(ruleId);
    if (!rule) {
      throw new Error("Rule not found");
    }

    if (rule.userId !== null && rule.userId !== userId) {
      throw new Error("Forbidden: You do not have permission to delete this rule");
    }
  }
}

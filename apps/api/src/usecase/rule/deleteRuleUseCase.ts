import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { RuleService } from "@/service/rule/ruleService";

/**
 * Delete Rule UseCase
 * ルールを削除
 */
export class DeleteRuleUseCase {
  constructor(
    private readonly ruleRepository: IRuleRepository,
    private readonly ruleService: RuleService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    // 権限チェック
    await this.ruleService.ensureUserCanDelete(id, userId);

    await this.ruleRepository.delete(id);
  }
}

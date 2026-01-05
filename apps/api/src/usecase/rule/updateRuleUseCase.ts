import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { RuleService } from "@/service/rule/ruleService";
import { Rule } from "@/domain/entity/rule";
import { UpdateRuleInput } from "@paypay-money-diary/shared";

/**
 * Update Rule UseCase
 * ルールを更新
 */
export class UpdateRuleUseCase {
  constructor(
    private readonly ruleRepository: IRuleRepository,
    private readonly ruleService: RuleService
  ) {}

  async execute(id: string, userId: string, input: UpdateRuleInput): Promise<Rule> {
    // 権限チェック
    await this.ruleService.ensureUserCanUpdate(id, userId);

    return this.ruleRepository.update(id, input);
  }
}

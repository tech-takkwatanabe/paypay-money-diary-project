import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { Rule } from "@/domain/entity/rule";
import { CreateRuleInput } from "@paypay-money-diary/shared";

/**
 * Create Rule UseCase
 * 新しいルールを作成
 */
export class CreateRuleUseCase {
  constructor(private readonly ruleRepository: IRuleRepository) {}

  async execute(userId: string, input: CreateRuleInput): Promise<Rule> {
    return this.ruleRepository.create(userId, input);
  }
}

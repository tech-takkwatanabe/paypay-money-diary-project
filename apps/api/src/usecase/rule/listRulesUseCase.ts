import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { Rule } from "@/domain/entity/rule";

/**
 * List Rules UseCase
 * ユーザーのルール一覧を取得
 */
export class ListRulesUseCase {
  constructor(private readonly ruleRepository: IRuleRepository) {}

  async execute(userId: string): Promise<Rule[]> {
    return this.ruleRepository.findByUserId(userId);
  }
}

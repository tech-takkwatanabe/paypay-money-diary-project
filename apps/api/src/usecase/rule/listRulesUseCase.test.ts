import { describe, it, expect, beforeEach, mock, Mock } from "bun:test";
import { ListRulesUseCase } from "./listRulesUseCase";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { Rule } from "@/domain/entity/rule";

describe("ListRulesUseCase", () => {
  let listRulesUseCase: ListRulesUseCase;
  let mockRuleRepository: IRuleRepository;

  const userId = "550e8400-e29b-41d4-a716-446655440001";
  const mockRule = new Rule(
    "550e8400-e29b-41d4-a716-446655440000",
    userId,
    "keyword-1",
    "550e8400-e29b-41d4-a716-446655440002",
    10,
    new Date(),
    new Date(),
    "Food"
  );

  beforeEach(() => {
    mockRuleRepository = {
      findById: mock(),
      findByUserId: mock(),
      create: mock(),
      update: mock(),
      delete: mock(),
    };
    listRulesUseCase = new ListRulesUseCase(mockRuleRepository);
  });

  it("should return rules for the user", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockRuleRepository.findByUserId as Mock<any>).mockResolvedValue([mockRule]);

    const result = await listRulesUseCase.execute(userId);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mockRule.id);
    expect(result[0].keyword).toBe(mockRule.keyword);
    expect(result[0].categoryId).toBe(mockRule.categoryId);
    expect(result[0].categoryName).toBe(mockRule.categoryName);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mockRuleRepository.findByUserId as Mock<any>).toHaveBeenCalledWith(userId);
  });
});

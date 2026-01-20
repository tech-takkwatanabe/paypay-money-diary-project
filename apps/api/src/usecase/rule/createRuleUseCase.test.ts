import { describe, it, expect, beforeEach, mock, Mock } from "bun:test";
import { CreateRuleUseCase } from "./createRuleUseCase";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { Rule } from "@/domain/entity/rule";
import { CreateRuleInput } from "@paypay-money-diary/shared";

describe("CreateRuleUseCase", () => {
  let createRuleUseCase: CreateRuleUseCase;
  let mockRuleRepository: IRuleRepository;

  const userId = "550e8400-e29b-41d4-a716-446655440001";
  const categoryId = "550e8400-e29b-41d4-a716-446655440002";
  const input: CreateRuleInput = { keyword: "keyword-1", categoryId, priority: 10 };
  const mockRule = new Rule(
    "550e8400-e29b-41d4-a716-446655440000",
    userId,
    "keyword-1",
    categoryId,
    10,
    new Date(),
    new Date(),
    "Food"
  );

  beforeEach(() => {
    mockRuleRepository = {
      findById: mock(),
      findByUserId: mock(),
      findByCategoryId: mock(),
      create: mock(),
      update: mock(),
      delete: mock(),
    };
    createRuleUseCase = new CreateRuleUseCase(mockRuleRepository);
  });

  it("should create a rule successfully", async () => {
    (mockRuleRepository.create as Mock<(_userId: string, _data: CreateRuleInput) => Promise<Rule>>).mockResolvedValue(
      mockRule
    );

    const result = await createRuleUseCase.execute(userId, input);

    expect(result.id).toBe(mockRule.id);
    expect(result.keyword).toBe(mockRule.keyword);
    expect(result.categoryId).toBe(mockRule.categoryId);
    expect(result.categoryName).toBe(mockRule.categoryName);
    expect(mockRuleRepository.create).toHaveBeenCalledWith(userId, input);
  });
});

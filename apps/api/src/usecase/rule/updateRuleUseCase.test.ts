import { describe, it, expect, beforeEach, mock, Mock } from "bun:test";
import { UpdateRuleUseCase } from "./updateRuleUseCase";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { RuleService } from "@/service/rule/ruleService";
import { Rule } from "@/domain/entity/rule";
import { UpdateRuleInput } from "@paypay-money-diary/shared";

describe("UpdateRuleUseCase", () => {
  let updateRuleUseCase: UpdateRuleUseCase;
  let mockRuleRepository: IRuleRepository;
  let mockRuleService: RuleService;

  const userId = "550e8400-e29b-41d4-a716-446655440001";
  const ruleId = "550e8400-e29b-41d4-a716-446655440000";
  const categoryId = "550e8400-e29b-41d4-a716-446655440002";
  const input: UpdateRuleInput = { keyword: "updated" };
  const mockRule = new Rule(ruleId, userId, "updated", categoryId, 10, new Date(), new Date(), "Food");

  beforeEach(() => {
    mockRuleRepository = {
      findById: mock(),
      findByUserId: mock(),
      create: mock(),
      update: mock(),
      delete: mock(),
    };
    mockRuleService = {
      ensureUserCanAccess: mock(),
      ensureUserCanUpdate: mock(),
      ensureUserCanDelete: mock(),
    } as unknown as RuleService;
    updateRuleUseCase = new UpdateRuleUseCase(mockRuleRepository, mockRuleService);
  });

  it("should update a rule successfully", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockRuleService.ensureUserCanUpdate as Mock<any>).mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockRuleRepository.update as Mock<any>).mockResolvedValue(mockRule);

    const result = await updateRuleUseCase.execute(ruleId, userId, input);

    expect(result.id).toBe(mockRule.id);
    expect(result.keyword).toBe(mockRule.keyword);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mockRuleService.ensureUserCanUpdate as Mock<any>).toHaveBeenCalledWith(ruleId, userId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mockRuleRepository.update as Mock<any>).toHaveBeenCalledWith(ruleId, input);
  });
});

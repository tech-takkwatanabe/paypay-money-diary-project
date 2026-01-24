import { describe, it, expect, beforeEach, mock, Mock } from "bun:test";
import { DeleteRuleUseCase } from "./deleteRuleUseCase";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { RuleService } from "@/service/rule/ruleService";

describe("DeleteRuleUseCase", () => {
  let deleteRuleUseCase: DeleteRuleUseCase;
  let mockRuleRepository: IRuleRepository;
  let mockRuleService: RuleService;

  const userId = "550e8400-e29b-41d4-a716-446655440001";
  const ruleId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    mockRuleRepository = {
      findById: mock(),
      findByUserId: mock(),
      findByCategoryId: mock(),
      findByUserIdAndKeyword: mock(),
      create: mock(),
      update: mock(),
      delete: mock(),
    };
    mockRuleService = {
      ensureUserCanAccess: mock(),
      ensureUserCanUpdate: mock(),
      ensureUserCanDelete: mock(),
    } as unknown as RuleService;
    deleteRuleUseCase = new DeleteRuleUseCase(mockRuleRepository, mockRuleService);
  });

  it("should delete a rule successfully", async () => {
    (mockRuleService.ensureUserCanDelete as Mock<(id: string, userId: string) => Promise<void>>).mockResolvedValue(
      undefined
    );
    (mockRuleRepository.delete as Mock<(id: string) => Promise<void>>).mockResolvedValue(undefined);

    await deleteRuleUseCase.execute(ruleId, userId);

    expect(mockRuleService.ensureUserCanDelete).toHaveBeenCalledWith(ruleId, userId);
    expect(mockRuleRepository.delete).toHaveBeenCalledWith(ruleId);
  });
});

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockRuleService.ensureUserCanDelete as Mock<any>).mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockRuleRepository.delete as Mock<any>).mockResolvedValue(undefined);

    await deleteRuleUseCase.execute(ruleId, userId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mockRuleService.ensureUserCanDelete as Mock<any>).toHaveBeenCalledWith(ruleId, userId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mockRuleRepository.delete as Mock<any>).toHaveBeenCalledWith(ruleId);
  });
});

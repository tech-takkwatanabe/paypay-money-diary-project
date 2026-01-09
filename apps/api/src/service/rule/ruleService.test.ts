import { describe, it, expect, beforeEach, mock, Mock } from "bun:test";
import { RuleService } from "./ruleService";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { Rule } from "@/domain/entity/rule";

describe("RuleService", () => {
  let ruleService: RuleService;
  let mockRuleRepository: IRuleRepository;

  const userId = "user-1";
  const otherUserId = "user-2";

  const ownRule = new Rule("rule-1", userId, "keyword-1", "cat-1", 10, new Date(), new Date(), "Food");
  const systemRule = new Rule("rule-2", null, "keyword-2", "cat-2", 20, new Date(), new Date(), "Other");
  const otherRule = new Rule("rule-3", otherUserId, "keyword-3", "cat-3", 30, new Date(), new Date(), "Transport");

  beforeEach(() => {
    mockRuleRepository = {
      findById: mock(),
      findByUserId: mock(),
      create: mock(),
      update: mock(),
      delete: mock(),
    };
    ruleService = new RuleService(mockRuleRepository);
  });

  describe("ensureUserCanAccess", () => {
    it("should allow access to own rule", async () => {
      (mockRuleRepository.findById as Mock<() => Promise<Rule | null>>).mockResolvedValue(ownRule);
      await expect(ruleService.ensureUserCanAccess("rule-1", userId)).resolves.toBeUndefined();
    });

    it("should allow access to system rule", async () => {
      (mockRuleRepository.findById as Mock<() => Promise<Rule | null>>).mockResolvedValue(systemRule);
      await expect(ruleService.ensureUserCanAccess("rule-2", userId)).resolves.toBeUndefined();
    });

    it("should throw error when rule not found", async () => {
      (mockRuleRepository.findById as Mock<() => Promise<Rule | null>>).mockResolvedValue(null);
      await expect(ruleService.ensureUserCanAccess("none", userId)).rejects.toThrow("Rule not found");
    });

    it("should throw error when accessing other user's rule", async () => {
      (mockRuleRepository.findById as Mock<() => Promise<Rule | null>>).mockResolvedValue(otherRule);
      await expect(ruleService.ensureUserCanAccess("rule-3", userId)).rejects.toThrow("Forbidden");
    });
  });

  describe("ensureUserCanUpdate", () => {
    it("should allow updating own rule", async () => {
      (mockRuleRepository.findById as Mock<() => Promise<Rule | null>>).mockResolvedValue(ownRule);
      await expect(ruleService.ensureUserCanUpdate("rule-1", userId)).resolves.toBeUndefined();
    });

    it("should allow updating system rule", async () => {
      (mockRuleRepository.findById as Mock<() => Promise<Rule | null>>).mockResolvedValue(systemRule);
      await expect(ruleService.ensureUserCanUpdate("rule-2", userId)).resolves.toBeUndefined();
    });

    it("should throw error when updating other user's rule", async () => {
      (mockRuleRepository.findById as Mock<() => Promise<Rule | null>>).mockResolvedValue(otherRule);
      await expect(ruleService.ensureUserCanUpdate("rule-3", userId)).rejects.toThrow("Forbidden");
    });
  });

  describe("ensureUserCanDelete", () => {
    it("should allow deleting own rule", async () => {
      (mockRuleRepository.findById as Mock<() => Promise<Rule | null>>).mockResolvedValue(ownRule);
      await expect(ruleService.ensureUserCanDelete("rule-1", userId)).resolves.toBeUndefined();
    });

    it("should allow deleting system rule", async () => {
      (mockRuleRepository.findById as Mock<() => Promise<Rule | null>>).mockResolvedValue(systemRule);
      await expect(ruleService.ensureUserCanDelete("rule-2", userId)).resolves.toBeUndefined();
    });

    it("should throw error when deleting other user's rule", async () => {
      (mockRuleRepository.findById as Mock<() => Promise<Rule | null>>).mockResolvedValue(otherRule);
      await expect(ruleService.ensureUserCanDelete("rule-3", userId)).rejects.toThrow("Forbidden");
    });
  });
});

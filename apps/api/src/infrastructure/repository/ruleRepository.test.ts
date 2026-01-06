import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { RuleRepository } from "./ruleRepository";
import { db } from "@/db";
import { Rule } from "@/domain/entity/rule";

describe("RuleRepository", () => {
  const repository = new RuleRepository();
  const mockDate = new Date("2024-01-01T00:00:00Z");

  const mockRuleData = {
    id: "rule-123",
    userId: "user-123",
    keyword: "amazon",
    categoryId: "cat-123",
    priority: 10,
    createdAt: mockDate,
    categoryName: "Shopping",
  };

  afterEach(() => {
    mock.restore();
  });

  describe("findByUserId", () => {
    it("should return rules if found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          leftJoin: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve([mockRuleData])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockRuleData])),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findByUserId("user-123");
      expect(rules).toHaveLength(1);
      expect(rules[0]).toBeInstanceOf(Rule);
      expect(rules[0].id).toBe(mockRuleData.id);
      expect(rules[0].keyword).toBe(mockRuleData.keyword);
      expect(rules[0].categoryName).toBe(mockRuleData.categoryName);
    });

    it("should return empty array if not found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          leftJoin: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve([])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([])),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findByUserId("user-123");
      expect(rules).toHaveLength(0);
    });
  });

  describe("findById", () => {
    it("should return rule if found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          leftJoin: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([mockRuleData])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockRuleData])),
        };
        return chain as unknown as never;
      });

      const rule = await repository.findById("rule-123");
      expect(rule).not.toBeNull();
      expect(rule?.id).toBe(mockRuleData.id);
    });

    it("should return null if not found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          leftJoin: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([])),
        };
        return chain as unknown as never;
      });

      const rule = await repository.findById("rule-123");
      expect(rule).toBeNull();
    });
  });

  describe("create", () => {
    it("should insert and return new rule", async () => {
      // Mock insert
      spyOn(db, "insert").mockImplementation(() => {
        const chain = {
          values: mock().mockReturnThis(),
          returning: mock().mockImplementation(() => Promise.resolve([{ id: mockRuleData.id }])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([{ id: mockRuleData.id }])),
        };
        return chain as unknown as never;
      });

      // Mock findById called internally
      // Since we can't easily spy on the repository instance method while testing it (unless we wrap it),
      // we mock the db.select call that findById makes.
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          leftJoin: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([mockRuleData])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockRuleData])),
        };
        return chain as unknown as never;
      });

      const input = {
        keyword: "amazon",
        categoryId: "cat-123",
        priority: 10,
      };

      const rule = await repository.create("user-123", input);

      expect(rule).not.toBeNull();
      expect(rule.id).toBe(mockRuleData.id);
      expect(rule.keyword).toBe(input.keyword);
    });

    it("should throw error if creation fails (findById returns null)", async () => {
      spyOn(db, "insert").mockImplementation(() => {
        const chain = {
          values: mock().mockReturnThis(),
          returning: mock().mockImplementation(() => Promise.resolve([{ id: mockRuleData.id }])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([{ id: mockRuleData.id }])),
        };
        return chain as unknown as never;
      });

      // Mock findById to return empty
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          leftJoin: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([])),
        };
        return chain as unknown as never;
      });

      const input = {
        keyword: "amazon",
        categoryId: "cat-123",
        priority: 10,
      };

      expect(repository.create("user-123", input)).rejects.toThrow("Failed to create rule");
    });
  });

  describe("update", () => {
    it("should update and return updated rule", async () => {
      // Mock update
      spyOn(db, "update").mockImplementation(() => {
        const chain = {
          set: mock().mockReturnThis(),
          where: mock().mockImplementation(() => Promise.resolve()),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(undefined)),
        };
        return chain as unknown as never;
      });

      // Mock findById called internally
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          leftJoin: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([mockRuleData])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockRuleData])),
        };
        return chain as unknown as never;
      });

      const input = {
        keyword: "updated",
      };

      const rule = await repository.update("rule-123", input);

      expect(rule).not.toBeNull();
      expect(rule.id).toBe(mockRuleData.id);
    });

    it("should throw error if rule not found after update", async () => {
      spyOn(db, "update").mockImplementation(() => {
        const chain = {
          set: mock().mockReturnThis(),
          where: mock().mockImplementation(() => Promise.resolve()),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(undefined)),
        };
        return chain as unknown as never;
      });

      // Mock findById to return empty
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          leftJoin: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([])),
        };
        return chain as unknown as never;
      });

      const input = {
        keyword: "updated",
      };

      expect(repository.update("rule-123", input)).rejects.toThrow("Rule not found after update");
    });
  });

  describe("delete", () => {
    it("should delete rule", async () => {
      spyOn(db, "delete").mockImplementation(() => {
        const chain = {
          where: mock().mockImplementation(() => Promise.resolve()),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(undefined)),
        };
        return chain as unknown as never;
      });

      await repository.delete("rule-123");
      // Expect no error
      expect(true).toBe(true);
    });
  });
});

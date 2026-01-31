import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { DefaultCategoryRuleRepository } from "./defaultCategoryRuleRepository";
import { db } from "@/db";

describe("DefaultCategoryRuleRepository", () => {
  const repository = new DefaultCategoryRuleRepository();

  const mockDefaultRuleData = {
    id: "default-rule-1",
    keyword: "マクドナルド",
    defaultCategoryId: "default-cat-1",
    priority: 0,
  };

  const mockDefaultRuleDataHighPriority = {
    id: "default-rule-2",
    keyword: "ＪＲ",
    defaultCategoryId: "default-cat-2",
    priority: 100,
  };

  const mockDefaultRuleDataZeroPriority = {
    id: "default-rule-3",
    keyword: "セブン-イレブン",
    defaultCategoryId: "default-cat-1",
    priority: 0,
  };

  afterEach(() => {
    mock.restore();
  });

  describe("findAll", () => {
    it("should return all default rules sorted by priority", async () => {
      const mockRules = [mockDefaultRuleData, mockDefaultRuleDataHighPriority];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(mockRules)),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findAll();

      expect(rules).toHaveLength(2);
      expect(rules[0].id).toBe("default-rule-1");
      expect(rules[0].keyword).toBe("マクドナルド");
      expect(rules[0].defaultCategoryId).toBe("default-cat-1");
      expect(rules[0].priority).toBe(0);

      expect(rules[1].id).toBe("default-rule-2");
      expect(rules[1].keyword).toBe("ＪＲ");
      expect(rules[1].defaultCategoryId).toBe("default-cat-2");
      expect(rules[1].priority).toBe(100);
    });

    it("should return empty array if no default rules exist", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve([])),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findAll();

      expect(rules).toHaveLength(0);
      expect(Array.isArray(rules)).toBe(true);
    });

    it("should preserve all properties in returned objects", async () => {
      const mockRules = [mockDefaultRuleData];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(mockRules)),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findAll();

      expect(rules[0]).toEqual({
        id: "default-rule-1",
        keyword: "マクドナルド",
        defaultCategoryId: "default-cat-1",
        priority: 0,
      });
    });

    it("should handle special characters in keywords", async () => {
      const specialCharRule = {
        id: "default-rule-special",
        keyword: "セブン-イレブン（全店）",
        defaultCategoryId: "default-cat-1",
        priority: 5,
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve([specialCharRule])),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findAll();

      expect(rules[0].keyword).toBe("セブン-イレブン（全店）");
      expect(rules).toHaveLength(1);
    });

    it("should maintain priority sorting order", async () => {
      const unsortedRules = [
        { ...mockDefaultRuleData, priority: 50 },
        { ...mockDefaultRuleData, id: "rule-2", priority: 10 },
        { ...mockDefaultRuleData, id: "rule-3", priority: 100 },
      ];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(unsortedRules)),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findAll();

      expect(rules[0].priority).toBe(50);
      expect(rules[1].priority).toBe(10);
      expect(rules[2].priority).toBe(100);
    });

    it("should handle multiple rules with same priority", async () => {
      const sameRulesData = [
        { ...mockDefaultRuleData, priority: 0 },
        { ...mockDefaultRuleData, id: "rule-2", priority: 0 },
        { ...mockDefaultRuleData, id: "rule-3", priority: 0 },
      ];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(sameRulesData)),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findAll();

      expect(rules).toHaveLength(3);
      expect(rules.every((r) => r.priority === 0)).toBe(true);
    });

    it("should handle very high priority values", async () => {
      const highPriorityRule = {
        ...mockDefaultRuleData,
        priority: 999999,
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve([highPriorityRule])),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findAll();

      expect(rules[0].priority).toBe(999999);
    });
  });

  describe("findById", () => {
    it("should return default rule if found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([mockDefaultRuleData])),
        };
        return chain as unknown as never;
      });

      const rule = await repository.findById("default-rule-1");

      expect(rule).not.toBeNull();
      expect(rule?.id).toBe("default-rule-1");
      expect(rule?.keyword).toBe("マクドナルド");
      expect(rule?.defaultCategoryId).toBe("default-cat-1");
      expect(rule?.priority).toBe(0);
    });

    it("should return null if rule not found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([])),
        };
        return chain as unknown as never;
      });

      const rule = await repository.findById("non-existent-id");

      expect(rule).toBeNull();
    });

    it("should preserve all properties when found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([mockDefaultRuleData])),
        };
        return chain as unknown as never;
      });

      const rule = await repository.findById("default-rule-1");

      expect(rule).toEqual({
        id: "default-rule-1",
        keyword: "マクドナルド",
        defaultCategoryId: "default-cat-1",
        priority: 0,
      });
    });

    it("should handle special characters in keyword", async () => {
      const specialCharRule = {
        id: "default-rule-special",
        keyword: "セブン-イレブン（全店舗）",
        defaultCategoryId: "default-cat-1",
        priority: 5,
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([specialCharRule])),
        };
        return chain as unknown as never;
      });

      const rule = await repository.findById("default-rule-special");

      expect(rule).not.toBeNull();
      expect(rule?.keyword).toBe("セブン-イレブン（全店舗）");
    });

    it("should handle UUIDs as rule IDs", async () => {
      const uuidRule = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        keyword: "test-keyword",
        defaultCategoryId: "550e8400-e29b-41d4-a716-446655440001",
        priority: 10,
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([uuidRule])),
        };
        return chain as unknown as never;
      });

      const rule = await repository.findById("550e8400-e29b-41d4-a716-446655440000");

      expect(rule?.id).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(rule?.defaultCategoryId).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("should handle priority = 0 correctly", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([mockDefaultRuleDataZeroPriority])),
        };
        return chain as unknown as never;
      });

      const rule = await repository.findById("default-rule-3");

      expect(rule).not.toBeNull();
      expect(rule?.priority).toBe(0);
    });

    it("should handle very high priority values", async () => {
      const highPriorityRule = {
        ...mockDefaultRuleData,
        priority: 999999,
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([highPriorityRule])),
        };
        return chain as unknown as never;
      });

      const rule = await repository.findById("default-rule-1");

      expect(rule?.priority).toBe(999999);
    });

    it("should handle empty keyword string", async () => {
      const emptyKeywordRule = {
        ...mockDefaultRuleData,
        keyword: "",
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([emptyKeywordRule])),
        };
        return chain as unknown as never;
      });

      const rule = await repository.findById("default-rule-1");

      expect(rule?.keyword).toBe("");
    });

    it("should handle long keyword strings", async () => {
      const longKeywordRule = {
        ...mockDefaultRuleData,
        keyword: "a".repeat(1000),
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([longKeywordRule])),
        };
        return chain as unknown as never;
      });

      const rule = await repository.findById("default-rule-1");

      expect(rule?.keyword).toBe("a".repeat(1000));
    });
  });

  describe("findByCategoryId", () => {
    it("should return rules for a specific category", async () => {
      const rulesForCategory = [
        { ...mockDefaultRuleData, defaultCategoryId: "default-cat-1" },
        { ...mockDefaultRuleDataZeroPriority, defaultCategoryId: "default-cat-1" },
      ];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(rulesForCategory)),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findByCategoryId("default-cat-1");

      expect(rules).toHaveLength(2);
      expect(rules.every((r) => r.defaultCategoryId === "default-cat-1")).toBe(true);
    });

    it("should return empty array if no rules for category", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve([])),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findByCategoryId("non-existent-category");

      expect(rules).toHaveLength(0);
      expect(Array.isArray(rules)).toBe(true);
    });

    it("should return rules sorted by priority", async () => {
      const unsortedRules = [
        { ...mockDefaultRuleData, defaultCategoryId: "default-cat-1", priority: 50 },
        { ...mockDefaultRuleData, id: "rule-2", defaultCategoryId: "default-cat-1", priority: 10 },
        { ...mockDefaultRuleData, id: "rule-3", defaultCategoryId: "default-cat-1", priority: 100 },
      ];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(unsortedRules)),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findByCategoryId("default-cat-1");

      expect(rules[0].priority).toBe(50);
      expect(rules[1].priority).toBe(10);
      expect(rules[2].priority).toBe(100);
    });

    it("should preserve all properties for rules", async () => {
      const categoryRules = [mockDefaultRuleData];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(categoryRules)),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findByCategoryId("default-cat-1");

      expect(rules[0]).toEqual({
        id: "default-rule-1",
        keyword: "マクドナルド",
        defaultCategoryId: "default-cat-1",
        priority: 0,
      });
    });

    it("should handle category ID as UUID", async () => {
      const categoryUUID = "550e8400-e29b-41d4-a716-446655440000";
      const ruleWithUUIDCategory = {
        ...mockDefaultRuleData,
        defaultCategoryId: categoryUUID,
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve([ruleWithUUIDCategory])),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findByCategoryId(categoryUUID);

      expect(rules[0].defaultCategoryId).toBe(categoryUUID);
    });

    it("should handle multiple rules with same priority for a category", async () => {
      const sameRulesForCategory = [
        { ...mockDefaultRuleData, defaultCategoryId: "default-cat-1", priority: 0 },
        { ...mockDefaultRuleData, id: "rule-2", defaultCategoryId: "default-cat-1", priority: 0 },
      ];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(sameRulesForCategory)),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findByCategoryId("default-cat-1");

      expect(rules).toHaveLength(2);
      expect(rules.every((r) => r.priority === 0)).toBe(true);
    });

    it("should handle special characters in keywords for category", async () => {
      const specialCharRules = [
        { ...mockDefaultRuleData, keyword: "セブン-イレブン", defaultCategoryId: "default-cat-1" },
        { ...mockDefaultRuleData, id: "rule-2", keyword: "ローソン（24時間）", defaultCategoryId: "default-cat-1" },
      ];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(specialCharRules)),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findByCategoryId("default-cat-1");

      expect(rules[0].keyword).toBe("セブン-イレブン");
      expect(rules[1].keyword).toBe("ローソン（24時間）");
    });

    it("should only return rules for the specified category", async () => {
      const rulesForCat1 = [{ ...mockDefaultRuleData, defaultCategoryId: "default-cat-1" }];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(rulesForCat1)),
        };
        return chain as unknown as never;
      });

      const rules = await repository.findByCategoryId("default-cat-1");

      expect(rules.every((r) => r.defaultCategoryId === "default-cat-1")).toBe(true);
      expect(rules.some((r) => r.defaultCategoryId === "default-cat-2")).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should handle database errors in findAll", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => {
            throw new Error("Database connection failed");
          }),
        };
        return chain as unknown as never;
      });

      try {
        await repository.findAll();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe("Database connection failed");
      }
    });

    it("should handle database errors in findById", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => {
            throw new Error("Database query failed");
          }),
        };
        return chain as unknown as never;
      });

      try {
        await repository.findById("default-rule-1");
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe("Database query failed");
      }
    });

    it("should handle database errors in findByCategoryId", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => {
            throw new Error("Category query failed");
          }),
        };
        return chain as unknown as never;
      });

      try {
        await repository.findByCategoryId("default-cat-1");
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe("Category query failed");
      }
    });
  });

  describe("data mapping", () => {
    it("should correctly map all properties from database row", async () => {
      const dbRow = {
        id: "db-rule-123",
        keyword: "Database Rule",
        defaultCategoryId: "db-cat-456",
        priority: 42,
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([dbRow])),
        };
        return chain as unknown as never;
      });

      const rule = await repository.findById("db-rule-123");

      expect(rule).toEqual(dbRow);
    });

    it("should not include extra fields in returned object", async () => {
      const dbRowWithExtra = {
        id: "default-rule-1",
        keyword: "マクドナルド",
        defaultCategoryId: "default-cat-1",
        priority: 0,
        extraField: "should not be returned",
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([dbRowWithExtra])),
        };
        return chain as unknown as never;
      });

      const rule = await repository.findById("default-rule-1");

      expect(rule).not.toHaveProperty("extraField");
      expect(Object.keys(rule || {})).toEqual(["id", "keyword", "defaultCategoryId", "priority"]);
    });
  });
});

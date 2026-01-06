import { describe, it, expect, beforeEach, mock } from "bun:test";
import { CsvService } from "./csvService";
import type { IRuleRepository } from "@/domain/repository/ruleRepository";
import type { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Rule } from "@/domain/entity/rule";
import { Category } from "@/domain/entity/category";

describe("CsvService", () => {
  let csvService: CsvService;
  let mockRuleRepository: IRuleRepository;
  let mockCategoryRepository: ICategoryRepository;

  // Sample test data
  const mockUserId = "user-123";
  const createMockRule = (id: string, keyword: string, categoryId: string, categoryName: string) => {
    const now = new Date().toISOString();
    return {
      id,
      keyword,
      categoryId,
      categoryName,
      priority: 0,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
      userId: mockUserId,
      belongsToUser: (userId: string) => userId === mockUserId,
      matches: () => false,
      toResponse: function() {
        return {
          id: this.id,
          keyword: this.keyword,
          categoryId: this.categoryId,
          categoryName: this.categoryName,
          priority: this.priority,
          isSystem: this.isSystem,
          userId: this.userId,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        };
      }
    };
  };

  const mockRules = [
    createMockRule("rule-1", "amazon", "cat-1", "Shopping"),
    createMockRule("rule-2", "starbucks", "cat-2", "Food")
  ];

  const now = new Date();
  const mockCategories = [
    { 
      id: "cat-1", 
      userId: mockUserId, 
      name: "Shopping", 
      color: "#FF0000",
      icon: null as string | null,
      displayOrder: 0,
      isDefault: false,
      createdAt: now,
      updatedAt: now
    },
    { 
      id: "cat-2", 
      userId: mockUserId, 
      name: "Food", 
      color: "#00FF00",
      icon: null as string | null,
      displayOrder: 0,
      isDefault: false,
      createdAt: now,
      updatedAt: now
    },
    { 
      id: "cat-3", 
      userId: mockUserId, 
      name: "その他", 
      color: "#CCCCCC",
      icon: null as string | null,
      displayOrder: 0,
      isDefault: true,
      createdAt: now,
      updatedAt: now
    }
  ];

  beforeEach(() => {
    // Setup mock repositories
    mockRuleRepository = {
      findByUserId: mock(async (userId: string) =>
        userId === mockUserId
          ? mockRules.map((r) => {
              const category = mockCategories.find((c) => c.id === r.categoryId);
              return new Rule(
                r.id,
                r.userId,
                r.keyword,
                r.categoryId,
                r.priority || 0,
                new Date(),
                new Date(),
                category?.name || null
              );
            })
          : []
      ),
      findById: mock(async () => null),
      create: mock(async (userId: string, input) => {
        const category = mockCategories.find((c) => c.id === input.categoryId);
        return new Rule(
          `rule-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          input.keyword,
          input.categoryId,
          input.priority || 0,
          new Date(),
          new Date(),
          category?.name || 'その他'
        );
      }),
      update: mock(async (id: string, input) => {
        const rule = mockRules.find((r) => r.id === id);
        if (!rule) throw new Error("Rule not found");
        const category = mockCategories.find((c) => c.id === (input.categoryId || rule.categoryId));
        return new Rule(
          rule.id,
          rule.userId,
          input.keyword || rule.keyword,
          input.categoryId || rule.categoryId,
          input.priority !== undefined ? input.priority : rule.priority,
          new Date(),
          new Date(),
          category?.name || rule.categoryName
        );
      }),
      delete: mock(async () => {})
    };

    mockCategoryRepository = {
      findByUserId: mock(async (userId: string) => 
        mockCategories.map(cat => new Category(
          cat.id,
          cat.name,
          cat.color,
          null, // icon
          0, // displayOrder
          false, // isDefault
          userId,
          new Date(),
          new Date()
        ))
      ),
      findById: mock(async (id: string) => {
        const category = mockCategories.find(cat => cat.id === id);
        if (!category) return null;
        return new Category(
          category.id,
          category.name,
          category.color,
          null, // icon
          0, // displayOrder
          false, // isDefault
          'test-user-id',
          new Date(),
          new Date()
        );
      }),
      create: mock(async (userId: string, input: { name: string; color: string; icon?: string | null; displayOrder?: number; isDefault?: boolean }): Promise<Category> => {
        const now = new Date();
        const newCategory = new Category(
          `new-cat-${Date.now()}`,
          input.name,
          input.color,
          input.icon || null,
          input.displayOrder || 0,
          input.isDefault || false,
          userId,
          now,
          now
        );
        mockCategories.push({
          id: newCategory.id,
          name: newCategory.name,
          color: newCategory.color,
          icon: newCategory.icon || null,
          displayOrder: newCategory.displayOrder,
          isDefault: newCategory.isDefault,
          userId: newCategory.userId || 'test-user-id',
          createdAt: now,
          updatedAt: now
        });
        return newCategory;
      }),
      update: mock(async (id: string, input: { name?: string; color?: string; icon?: string | null; displayOrder?: number; isDefault?: boolean }): Promise<Category> => {
        const index = mockCategories.findIndex(cat => cat.id === id);
        if (index === -1) throw new Error('Category not found');
        
        const now = new Date();
        const category = mockCategories[index];
        const updatedCategory = new Category(
          id,
          input.name ?? category.name,
          input.color ?? category.color,
          input.icon ?? category.icon,
          input.displayOrder ?? category.displayOrder,
          input.isDefault ?? category.isDefault,
          category.userId,
          category.createdAt,
          now
        );
        
        mockCategories[index] = {
          ...mockCategories[index],
          ...input,
          updatedAt: new Date()
        };
        
        return updatedCategory;
      }),
      delete: mock(async (id: string) => {
        const index = mockCategories.findIndex(cat => cat.id === id);
        if (index !== -1) {
          mockCategories.splice(index, 1);
        }
      })
    };

    csvService = new CsvService(mockRuleRepository, mockCategoryRepository);
  });

  describe("parseCsv", () => {
    it("should parse CSV content", () => {
      const mockCsvContent = "取引日,出金金額（円）,入金金額（円）,海外出金金額,通貨,変換レート（円）,利用国,取引内容,取引先,取引方法,支払い区分,利用者,取引番号\n2023/01/01 14:30:00,1000,,,JPY,1,日本,支払い,Test Store,PayPay残高,通常,User,1234567890";
      const result = csvService.parseCsv(mockCsvContent);
      
      expect(result).toHaveProperty('expenses');
      expect(Array.isArray(result.expenses)).toBe(true);
      expect(result).toHaveProperty('rawData');
      expect(Array.isArray(result.rawData)).toBe(true);
      expect(result).toHaveProperty('totalRows');
      expect(result).toHaveProperty('expenseRows');
      expect(result).toHaveProperty('skippedRows');
      
      if (result.expenses.length > 0) {
        const expense = result.expenses[0];
        expect(expense).toHaveProperty('transactionDate');
        expect(expense).toHaveProperty('amount');
        expect(expense).toHaveProperty('merchant');
        expect(expense).toHaveProperty('paymentMethod');
        expect(expense).toHaveProperty('externalTransactionId');
      }
    });
  });
});

import { describe, it, expect, beforeEach, mock, type Mock } from "bun:test";
import { CsvService } from "./csvService";
import type { IRuleRepository } from "@/domain/repository/ruleRepository";
import type { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Rule } from "@/domain/entity/rule";
import { Category } from "@/domain/entity/category";
import { ParsedExpense, CsvParseResult } from "@/infrastructure/csv/paypayParser";

describe("CsvService", () => {
  let csvService: CsvService;
  let findRulesByUserIdMock: Mock<(userId: string) => Promise<Rule[]>>;
  let findCategoriesByUserIdMock: Mock<(userId: string) => Promise<Category[]>>;
  let mockParsePayPayCsv: Mock<(content: string) => CsvParseResult>;

  const mockUserId = "user-123";
  const now = new Date();

  const mockCategories = [
    new Category("cat-1", "Shopping", "#FF0000", null, 0, false, mockUserId, now, now),
    new Category("cat-2", "Food", "#00FF00", null, 1, false, mockUserId, now, now),
    new Category("cat-3", "その他", "#CCCCCC", null, 2, true, mockUserId, now, now),
  ];

  const mockRules = [
    new Rule("rule-1", mockUserId, "amazon", "cat-1", 0, now, now, "Shopping"),
    new Rule("rule-2", mockUserId, "starbucks", "cat-2", 0, now, now, "Food"),
  ];

  beforeEach(() => {
    findRulesByUserIdMock = mock(async () => mockRules);
    findCategoriesByUserIdMock = mock(async () => mockCategories);

    mockParsePayPayCsv = mock(
      (_content: string): CsvParseResult => ({
        expenses: [],
        rawData: [],
        totalRows: 0,
        expenseRows: 0,
        skippedRows: 0,
      })
    );

    const mockRuleRepository = {
      findByUserId: findRulesByUserIdMock,
    } as unknown as IRuleRepository;

    const mockCategoryRepository = {
      findByUserId: findCategoriesByUserIdMock,
    } as unknown as ICategoryRepository;

    csvService = new CsvService(mockRuleRepository, mockCategoryRepository, mockParsePayPayCsv);
  });

  describe("parseCsv", () => {
    it("should call parsePayPayCsv with content", () => {
      const content = "test,csv,content";
      const expectedResult: CsvParseResult = {
        expenses: [],
        rawData: [],
        totalRows: 0,
        expenseRows: 0,
        skippedRows: 0,
      };
      mockParsePayPayCsv.mockReturnValue(expectedResult);

      const result = csvService.parseCsv(content);

      expect(mockParsePayPayCsv).toHaveBeenCalledWith(content);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("assignCategories", () => {
    it("should assign categories based on rules", async () => {
      const expenses: ParsedExpense[] = [
        {
          transactionDate: now,
          amount: 1000,
          merchant: "Amazon.co.jp",
          paymentMethod: "PayPay",
          externalTransactionId: "1",
        },
        {
          transactionDate: now,
          amount: 500,
          merchant: "Starbucks Coffee",
          paymentMethod: "PayPay",
          externalTransactionId: "2",
        },
        {
          transactionDate: now,
          amount: 2000,
          merchant: "Unknown Store",
          paymentMethod: "PayPay",
          externalTransactionId: "3",
        },
      ];

      const result = await csvService.assignCategories(expenses, mockUserId);

      expect(findRulesByUserIdMock).toHaveBeenCalledWith(mockUserId);
      expect(findCategoriesByUserIdMock).toHaveBeenCalledWith(mockUserId);

      expect(result.get("Amazon.co.jp")).toBe("cat-1");
      expect(result.get("Starbucks Coffee")).toBe("cat-2");
      expect(result.get("Unknown Store")).toBe("cat-3"); // Default category "その他"
    });

    it("should use null if default category 'その他' is not found", async () => {
      findCategoriesByUserIdMock.mockReturnValue(Promise.resolve([]));
      const expenses: ParsedExpense[] = [
        {
          transactionDate: now,
          amount: 2000,
          merchant: "Unknown Store",
          paymentMethod: "PayPay",
          externalTransactionId: "3",
        },
      ];

      const result = await csvService.assignCategories(expenses, mockUserId);
      expect(result.get("Unknown Store")).toBeNull();
    });

    it("should skip duplicate merchants to optimize", async () => {
      const expenses: ParsedExpense[] = [
        {
          transactionDate: now,
          amount: 1000,
          merchant: "Amazon",
          paymentMethod: "PayPay",
          externalTransactionId: "1",
        },
        {
          transactionDate: now,
          amount: 2000,
          merchant: "Amazon",
          paymentMethod: "PayPay",
          externalTransactionId: "2",
        },
      ];

      const result = await csvService.assignCategories(expenses, mockUserId);
      expect(result.size).toBe(1);
      expect(result.get("Amazon")).toBe("cat-1");
    });
  });
});

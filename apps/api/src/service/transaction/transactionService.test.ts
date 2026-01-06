import { describe, expect, test, beforeEach, mock } from "bun:test";
import { TransactionService } from "./transactionService";
import { Transaction } from "@/domain/entity/transaction";
import { ITransactionRepository } from "@/domain/repository/transactionRepository";

// Mock the transaction repository
const mockTransactionRepository: ITransactionRepository = {
  findById: mock(async (id: string) => {
    if (id === "user1-tx1") {
      return new Transaction(
        "user1-tx1",
        "user1",
        new Date("2023-01-15"),
        "Test Transaction 1",
        1000,
        "cat1",
        "Food",
        "#FF0000"
      );
    } else if (id === "user2-tx1") {
      return new Transaction(
        "user2-tx1",
        "user2",
        new Date("2023-01-15"),
        "Test Transaction 2",
        2000,
        "cat2",
        "Transport",
        "#00FF00"
      );
    }
    return null;
  }),
  // Add other required methods with mock implementations
  create: mock(async (transaction) => ({
    ...transaction,
    id: 'new-transaction-id',
    belongsToUser: (userId: string) => userId === transaction.userId,
    belongsToYearMonth: () => true,
    belongsToCategory: () => true,
    changeCategory: function(categoryId: string, categoryName: string, categoryColor: string) {
      return new Transaction(
        this.id,
        this.userId,
        this.date,
        this.description,
        this.amount,
        categoryId,
        categoryName,
        categoryColor,
        this.createdAt,
        this.updatedAt
      );
    },
    toResponse: function() {
      return {
        id: this.id,
        userId: this.userId,
        date: this.date.toISOString(),
        description: this.description,
        amount: this.amount,
        categoryId: this.categoryId,
        categoryName: this.categoryName,
        categoryColor: this.categoryColor,
        createdAt: this.createdAt?.toISOString(),
        updatedAt: this.updatedAt?.toISOString(),
      };
    }
  } as Transaction)),
  
  update: mock(async (id: string, input) => {
    const transaction = await mockTransactionRepository.findById(id);
    if (!transaction) throw new Error('Transaction not found');
    
    return {
      ...transaction,
      ...input,
      id,
    } as Transaction;
  }),
  
  delete: mock(async () => {
    return undefined;
  }),
  
  findByUserId: mock(async () => []),
  
  countByUserId: mock(async () => 0),
  
  getAvailableYears: mock(async () => [new Date().getFullYear()]),
  
  reCategorizeByRules: mock(async () => 0),
  
  createMany: mock(async () => []),
  
  existsByExternalId: mock(async () => false),
};

describe("TransactionService", () => {
  let service: TransactionService;

  beforeEach(() => {
    // Reset all mocks before each test
    for (const [_, mockFn] of Object.entries(mockTransactionRepository)) {
      if (typeof mockFn === 'function' && 'mock' in mockFn) {
        mockFn.mockClear();
      }
    }
    service = new TransactionService(mockTransactionRepository);
  });

  describe("ensureUserCanAccess", () => {
    test("should return transaction if user is the owner", async () => {
      const transaction = await service.ensureUserCanAccess("user1-tx1", "user1");
      expect(transaction).toBeDefined();
      expect(transaction.id).toBe("user1-tx1");
      expect(transaction.userId).toBe("user1");
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith("user1-tx1");
    });

    test("should throw error if transaction not found", async () => {
      await expect(service.ensureUserCanAccess("nonexistent", "user1")).rejects.toThrow("Transaction not found");
    });

    test("should throw error if user is not the owner", async () => {
      await expect(service.ensureUserCanAccess("user2-tx1", "user1")).rejects.toThrow("Forbidden: You do not have access to this transaction");
    });
  });

  describe("calculateSummary", () => {
    const mockTransactions = [
      new Transaction("tx1", "user1", new Date("2023-01-15"), "Lunch", 1000, "food", "Food", "#FF0000"),
      new Transaction("tx2", "user1", new Date("2023-01-16"), "Dinner", 2000, "food", "Food", "#FF0000"),
      new Transaction("tx3", "user1", new Date("2023-01-17"), "Bus", 500, "trans", "Transport", "#0000FF"),
      new Transaction("tx4", "user1", new Date("2023-01-18"), "Unknown", 300, "", "", ""),
    ];

    test("should calculate correct totals and category breakdown", () => {
      const result = service.calculateSummary(mockTransactions);
      
      expect(result.totalAmount).toBe(3800);
      expect(result.transactionCount).toBe(4);
      
      // Check category breakdown
      expect(result.categoryBreakdown).toHaveLength(3);
      
      const foodCategory = result.categoryBreakdown.find(c => c.categoryId === "food");
      expect(foodCategory).toBeDefined();
      expect(foodCategory?.totalAmount).toBe(3000);
      expect(foodCategory?.transactionCount).toBe(2);
      
      const transCategory = result.categoryBreakdown.find(c => c.categoryId === "trans");
      expect(transCategory).toBeDefined();
      expect(transCategory?.totalAmount).toBe(500);
      
      const unclassified = result.categoryBreakdown.find(c => c.categoryId === "");
      expect(unclassified).toBeDefined();
      expect(unclassified?.categoryName).toBe("未分類");
      expect(unclassified?.categoryColor).toBe("#CCCCCC");
      expect(unclassified?.totalAmount).toBe(300);
    });

    test("should handle empty transactions array", () => {
      const result = service.calculateSummary([]);
      expect(result.totalAmount).toBe(0);
      expect(result.transactionCount).toBe(0);
      expect(result.categoryBreakdown).toHaveLength(0);
    });
  });

  describe("calculateMonthlyBreakdown", () => {
    const mockTransactions = [
      // January transactions
      new Transaction("tx1", "user1", new Date("2023-01-15"), "Lunch", 1000, "food", "Food", "#FF0000"),
      new Transaction("tx2", "user1", new Date("2023-01-20"), "Dinner", 2000, "food", "Food", "#FF0000"),
      new Transaction("tx3", "user1", new Date("2023-01-25"), "Bus", 500, "trans", "Transport", "#0000FF"),
      // February transactions
      new Transaction("tx4", "user1", new Date("2023-02-10"), "Grocery", 1500, "food", "Food", "#FF0000"),
      new Transaction("tx5", "user1", new Date("2023-02-15"), "Taxi", 700, "trans", "Transport", "#0000FF"),
      // March transaction (uncategorized)
      new Transaction("tx6", "user1", new Date("2023-03-05"), "Unknown", 300, "", "", ""),
    ];

    test("should group transactions by month with category breakdown", () => {
      const result = service.calculateMonthlyBreakdown(mockTransactions);
      
      // Should have 3 months of data
      expect(result).toHaveLength(3);
      
      // Check January
      const january = result.find(m => m.month === 1);
      expect(january).toBeDefined();
      expect(january?.totalAmount).toBe(3500);
      expect(january?.categories).toHaveLength(2);
      
      const janFood = january?.categories.find(c => c.categoryId === "food");
      expect(janFood?.amount).toBe(3000);
      
      // Check February
      const february = result.find(m => m.month === 2);
      expect(february?.totalAmount).toBe(2200);
      
      // Check March (uncategorized)
      const march = result.find(m => m.month === 3);
      expect(march?.categories[0].categoryName).toBe("未分類");
      expect(march?.categories[0].categoryColor).toBe("#CCCCCC");
    });

    test("should return empty array for empty transactions", () => {
      const result = service.calculateMonthlyBreakdown([]);
      expect(result).toHaveLength(0);
    });
  });
});

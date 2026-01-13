import { describe, it, expect, mock, spyOn, beforeEach } from "bun:test";
import { TransactionRepository } from "./transactionRepository";
import { db } from "@/db";
import { Transaction } from "@/domain/entity/transaction";

describe("TransactionRepository", () => {
  let repository: TransactionRepository;

  const mockTransactionRow = {
    id: "tx-123",
    userId: "user-123",
    date: new Date("2023-01-15"),
    description: "Test Merchant",
    amount: 1000,
    categoryId: "cat-123",
    categoryName: "Food",
    categoryColor: "#FF0000",
    createdAt: new Date(),
  };

  beforeEach(() => {
    repository = new TransactionRepository();
  });

  describe("findByUserId", () => {
    it("should return transactions for a user", async () => {
      const mockResults = [mockTransactionRow];

      const queryChain = {
        from: mock().mockReturnThis(),
        leftJoin: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        $dynamic: mock().mockReturnThis(),
        orderBy: mock().mockImplementation(() => Promise.resolve(mockResults)),
      };

      spyOn(db, "select").mockImplementation(() => queryChain as unknown as never);

      const transactions = await repository.findByUserId("user-123");

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toBeInstanceOf(Transaction);
      expect(transactions[0].id).toBe(mockTransactionRow.id);
      expect(transactions[0].categoryName).toBe(mockTransactionRow.categoryName);
    });

    it("should apply filters correctly", async () => {
      const queryChain = {
        from: mock().mockReturnThis(),
        leftJoin: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        $dynamic: mock().mockReturnThis(),
        limit: mock().mockReturnThis(),
        offset: mock().mockReturnThis(),
        orderBy: mock().mockImplementation(() => Promise.resolve([])),
      };

      const selectSpy = spyOn(db, "select").mockImplementation(() => queryChain as unknown as never);

      await repository.findByUserId("user-123", {
        year: 2023,
        month: 1,
        categoryId: "cat-1",
        pagination: { page: 1, limit: 10 },
      });

      expect(selectSpy).toHaveBeenCalled();
      expect(queryChain.where).toHaveBeenCalled();
      expect(queryChain.limit).toHaveBeenCalledWith(10);
      expect(queryChain.offset).toHaveBeenCalledWith(0);
    });
  });

  describe("findById", () => {
    it("should return a transaction by id", async () => {
      const queryChain = {
        from: mock().mockReturnThis(),
        leftJoin: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        limit: mock().mockImplementation(() => Promise.resolve([mockTransactionRow])),
      };

      spyOn(db, "select").mockImplementation(() => queryChain as unknown as never);

      const transaction = await repository.findById("tx-123");

      expect(transaction).not.toBeNull();
      expect(transaction?.id).toBe(mockTransactionRow.id);
    });

    it("should return null if not found", async () => {
      const queryChain = {
        from: mock().mockReturnThis(),
        leftJoin: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        limit: mock().mockImplementation(() => Promise.resolve([])),
      };

      spyOn(db, "select").mockImplementation(() => queryChain as unknown as never);

      const transaction = await repository.findById("nonexistent");

      expect(transaction).toBeNull();
    });
  });

  describe("create", () => {
    it("should insert and return a new transaction", async () => {
      const input = {
        userId: "user-123",
        date: new Date(),
        description: "New Tx",
        amount: 500,
        categoryId: "cat-1",
        categoryName: "Shopping",
        categoryColor: "#0000FF",
        displayOrder: 1,
      };

      const mockInsertedRow = {
        id: "new-id",
        userId: input.userId,
        transactionDate: input.date,
        merchant: input.description,
        amount: input.amount,
        categoryId: input.categoryId,
        createdAt: new Date(),
      };

      const queryChain = {
        values: mock().mockReturnThis(),
        returning: mock().mockImplementation(() => Promise.resolve([mockInsertedRow])),
      };

      spyOn(db, "insert").mockImplementation(() => queryChain as unknown as never);

      const transaction = await repository.create(input);

      expect(transaction.id).toBe("new-id");
      expect(transaction.description).toBe(input.description);
      expect(transaction.categoryName).toBe(input.categoryName);
    });
  });

  describe("update", () => {
    it("should update and return the transaction", async () => {
      const mockCategory = { id: "cat-2", name: "Food", color: "#FF0000" };
      const mockUpdatedRow = {
        id: "tx-123",
        userId: "user-123",
        transactionDate: new Date(),
        merchant: "Updated",
        amount: 1000,
        categoryId: "cat-2",
        createdAt: new Date(),
      };

      // Mock category lookup
      const selectChain = {
        from: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        limit: mock().mockImplementation(() => Promise.resolve([mockCategory])),
      };

      // Mock update
      const updateChain = {
        set: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        returning: mock().mockImplementation(() => Promise.resolve([mockUpdatedRow])),
      };

      spyOn(db, "select").mockImplementation(() => selectChain as unknown as never);
      spyOn(db, "update").mockImplementation(() => updateChain as unknown as never);

      const transaction = await repository.update("tx-123", { categoryId: "cat-2" });

      expect(transaction.categoryId).toBe("cat-2");
      expect(transaction.categoryName).toBe("Food");
    });
  });

  describe("delete", () => {
    it("should delete a transaction", async () => {
      const deleteChain = {
        where: mock().mockImplementation(() => Promise.resolve()),
      };

      spyOn(db, "delete").mockImplementation(() => deleteChain as unknown as never);

      await repository.delete("tx-123");

      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe("getAvailableYears", () => {
    it("should return distinct years", async () => {
      const mockYears = [{ year: 2023 }, { year: 2024 }];

      const queryChain = {
        from: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        orderBy: mock().mockImplementation(() => Promise.resolve(mockYears)),
      };

      spyOn(db, "selectDistinct").mockImplementation(() => queryChain as unknown as never);

      const years = await repository.getAvailableYears("user-123");

      expect(years).toEqual([2023, 2024]);
    });
  });
});

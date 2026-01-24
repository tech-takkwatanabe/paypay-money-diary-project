import { describe, it, expect, mock, beforeEach, Mock } from "bun:test";
import { DeleteTransactionUseCase } from "./deleteTransactionUseCase";
import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { TransactionService } from "@/service/transaction/transactionService";
import { Transaction } from "@/domain/entity/transaction";

describe("DeleteTransactionUseCase", () => {
  let useCase: DeleteTransactionUseCase;
  let transactionRepository: ITransactionRepository;
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionRepository = {
      findById: mock().mockResolvedValue(null),
      delete: mock().mockResolvedValue(undefined),
    } as unknown as ITransactionRepository;

    transactionService = new TransactionService(transactionRepository);
    useCase = new DeleteTransactionUseCase(transactionRepository, transactionService);
  });

  it("should delete transaction when user has access and payment method is '手動'", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "Store A",
      1000,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "手動",
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act
    await useCase.execute(id, userId);

    // Assert
    expect(transactionRepository.findById).toHaveBeenCalledWith(id);
    expect(transactionRepository.delete).toHaveBeenCalledWith(id);
  });

  it("should throw error when transaction not found", async () => {
    // Arrange
    const id = "non-existent-tx";
    const userId = "user-123";

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(null);

    // Act & Assert
    expect(useCase.execute(id, userId)).rejects.toThrow("Transaction not found");
    expect(transactionRepository.findById).toHaveBeenCalledWith(id);
    expect(transactionRepository.delete).not.toHaveBeenCalled();
  });

  it("should throw error when user does not have access", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const otherUserId = "other-user-456";
    const mockTransaction = new Transaction(
      id,
      otherUserId,
      new Date(),
      "Store A",
      1000,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "手動",
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act & Assert
    expect(useCase.execute(id, userId)).rejects.toThrow("Forbidden: You do not have access to this transaction");
    expect(transactionRepository.findById).toHaveBeenCalledWith(id);
    expect(transactionRepository.delete).not.toHaveBeenCalled();
  });

  it("should throw error when payment method is not '手動'", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "Store A",
      1000,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "PayPay",
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act & Assert
    expect(useCase.execute(id, userId)).rejects.toThrow("Forbidden: Only cash transactions can be deleted");
    expect(transactionRepository.findById).toHaveBeenCalledWith(id);
    expect(transactionRepository.delete).not.toHaveBeenCalled();
  });

  it("should throw error when payment method is null", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "Store A",
      1000,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      null,
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act & Assert
    expect(useCase.execute(id, userId)).rejects.toThrow("Forbidden: Only cash transactions can be deleted");
    expect(transactionRepository.findById).toHaveBeenCalledWith(id);
    expect(transactionRepository.delete).not.toHaveBeenCalled();
  });

  it("should throw error when payment method is empty string", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "Store A",
      1000,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "",
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act & Assert
    expect(useCase.execute(id, userId)).rejects.toThrow("Forbidden: Only cash transactions can be deleted");
    expect(transactionRepository.findById).toHaveBeenCalledWith(id);
    expect(transactionRepository.delete).not.toHaveBeenCalled();
  });

  it("should handle various non-manual payment methods", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const paymentMethods = ["PayPay", "クレジットカード", "銀行振込", "電子マネー", "QRコード決済"];

    for (const paymentMethod of paymentMethods) {
      const mockTransaction = new Transaction(
        id,
        userId,
        new Date(),
        "Store A",
        1000,
        "cat-1",
        "Food",
        "#FF0000",
        100,
        paymentMethod,
        new Date(),
        new Date()
      );

      (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(
        mockTransaction
      );

      // Act & Assert
      await expect(useCase.execute(id, userId)).rejects.toThrow("Forbidden: Only cash transactions can be deleted");
      expect(transactionRepository.delete).not.toHaveBeenCalled();
    }
  });

  it("should delete transaction with zero amount", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "Free item",
      0,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "手動",
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act
    await useCase.execute(id, userId);

    // Assert
    expect(transactionRepository.delete).toHaveBeenCalledWith(id);
  });

  it("should delete transaction with negative amount", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "Refund",
      -500,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "手動",
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act
    await useCase.execute(id, userId);

    // Assert
    expect(transactionRepository.delete).toHaveBeenCalledWith(id);
  });

  it("should delete transaction with very large amount", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "Large purchase",
      999999999,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "手動",
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act
    await useCase.execute(id, userId);

    // Assert
    expect(transactionRepository.delete).toHaveBeenCalledWith(id);
  });

  it("should delete transaction with null category", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "Uncategorized",
      1000,
      null,
      "その他",
      "#CCCCCC",
      100,
      "手動",
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act
    await useCase.execute(id, userId);

    // Assert
    expect(transactionRepository.delete).toHaveBeenCalledWith(id);
  });

  it("should delete transaction with empty description", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "",
      1000,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "手動",
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act
    await useCase.execute(id, userId);

    // Assert
    expect(transactionRepository.delete).toHaveBeenCalledWith(id);
  });

  it("should delete old transaction", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date("2000-01-01"),
      "Old transaction",
      1000,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "手動",
      new Date("2000-01-01"),
      new Date("2000-01-01")
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act
    await useCase.execute(id, userId);

    // Assert
    expect(transactionRepository.delete).toHaveBeenCalledWith(id);
  });

  it("should delete future transaction", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date("2099-12-31"),
      "Future transaction",
      1000,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "手動",
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act
    await useCase.execute(id, userId);

    // Assert
    expect(transactionRepository.delete).toHaveBeenCalledWith(id);
  });

  it("should handle special characters in transaction ID", async () => {
    // Arrange
    const id = "tx-special-123-abc";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "Store A",
      1000,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "手動",
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act
    await useCase.execute(id, userId);

    // Assert
    expect(transactionRepository.findById).toHaveBeenCalledWith(id);
    expect(transactionRepository.delete).toHaveBeenCalledWith(id);
  });

  it("should handle special characters in user ID", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-special-123-abc";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "Store A",
      1000,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "手動",
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act
    await useCase.execute(id, userId);

    // Assert
    expect(transactionRepository.delete).toHaveBeenCalledWith(id);
  });

  it("should verify exact payment method match (case-sensitive)", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "Store A",
      1000,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "手動", // Exact match
      new Date(),
      new Date()
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act
    await useCase.execute(id, userId);

    // Assert
    expect(transactionRepository.delete).toHaveBeenCalledWith(id);
  });

  it("should reject similar but not exact payment method", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const similarPaymentMethods = ["手動 ", " 手動", "手 動", "MANUAL", "manual"];

    for (const paymentMethod of similarPaymentMethods) {
      const mockTransaction = new Transaction(
        id,
        userId,
        new Date(),
        "Store A",
        1000,
        "cat-1",
        "Food",
        "#FF0000",
        100,
        paymentMethod,
        new Date(),
        new Date()
      );

      (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(
        mockTransaction
      );

      // Act & Assert
      await expect(useCase.execute(id, userId)).rejects.toThrow("Forbidden: Only cash transactions can be deleted");
      expect(transactionRepository.delete).not.toHaveBeenCalled();
    }
  });

  it("should call repository methods in correct order", async () => {
    // Arrange
    const id = "tx-1";
    const userId = "user-123";
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "Store A",
      1000,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      "手動",
      new Date(),
      new Date()
    );

    const callOrder: string[] = [];
    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockImplementation(async () => {
      callOrder.push("findById");
      return mockTransaction;
    });
    (transactionRepository.delete as Mock<typeof transactionRepository.delete>).mockImplementation(async () => {
      callOrder.push("delete");
    });

    // Act
    await useCase.execute(id, userId);

    // Assert
    expect(callOrder).toEqual(["findById", "delete"]);
  });
});

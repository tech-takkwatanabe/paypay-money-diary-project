import { describe, it, expect, mock, beforeEach, Mock } from "bun:test";
import { UpdateTransactionUseCase } from "./updateTransactionUseCase";
import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { TransactionService } from "@/service/transaction/transactionService";
import { Transaction } from "@/domain/entity/transaction";

describe("UpdateTransactionUseCase", () => {
  let useCase: UpdateTransactionUseCase;
  let transactionRepository: ITransactionRepository;
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionRepository = {
      findById: mock().mockResolvedValue(null),
      update: mock().mockResolvedValue({}),
    } as unknown as ITransactionRepository;

    transactionService = new TransactionService(transactionRepository);
    useCase = new UpdateTransactionUseCase(transactionRepository, transactionService);
  });

  it("should update transaction when user has access", async () => {
    // Arrange
    const id = "1";
    const userId = "user-123";
    const input = { categoryId: "cat-new" };
    const mockTransaction = new Transaction(
      id,
      userId,
      new Date(),
      "Store A",
      1000,
      "cat-old",
      "Old",
      "#000000",
      100,
      new Date(),
      undefined
    );

    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);
    (transactionRepository.update as Mock<typeof transactionRepository.update>).mockResolvedValue(
      new Transaction(id, userId, new Date(), "Store A", 1000, "cat-new", "New", "#FFFFFF", 100, new Date(), undefined)
    );

    // Act
    const result = await useCase.execute(id, userId, input);

    // Assert
    expect(transactionRepository.update).toHaveBeenCalledWith(id, input);
    expect(result.categoryId).toBe("cat-new");
  });

  it("should throw error when transaction not found", async () => {
    // Arrange
    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(null);

    // Act & Assert
    expect(useCase.execute("1", "user-123", { categoryId: "cat-1" })).rejects.toThrow("Transaction not found");
  });

  it("should throw error when user does not have access", async () => {
    // Arrange
    const mockTransaction = new Transaction(
      "1",
      "other-user",
      new Date(),
      "Store A",
      1000,
      "cat-1",
      "Food",
      "#FF0000",
      100,
      new Date(),
      undefined
    );
    (transactionRepository.findById as Mock<typeof transactionRepository.findById>).mockResolvedValue(mockTransaction);

    // Act & Assert
    expect(useCase.execute("1", "user-123", { categoryId: "cat-1" })).rejects.toThrow("Forbidden");
  });
});

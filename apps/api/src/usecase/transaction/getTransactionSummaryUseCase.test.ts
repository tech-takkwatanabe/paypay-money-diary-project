import { describe, it, expect, mock, beforeEach, Mock } from "bun:test";
import { GetTransactionSummaryUseCase } from "./getTransactionSummaryUseCase";
import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { TransactionService } from "@/service/transaction/transactionService";
import { Transaction } from "@/domain/entity/transaction";

describe("GetTransactionSummaryUseCase", () => {
  let useCase: GetTransactionSummaryUseCase;
  let transactionRepository: ITransactionRepository;
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionRepository = {
      findByUserId: mock().mockResolvedValue([]),
    } as unknown as ITransactionRepository;

    transactionService = new TransactionService(transactionRepository);
    useCase = new GetTransactionSummaryUseCase(transactionRepository, transactionService);
  });

  it("should return summary and category breakdown", async () => {
    // Arrange
    const userId = "user-123";
    const year = 2024;

    const mockTransactions = [
      new Transaction(
        "1",
        userId,
        new Date("2024-01-15"),
        "Store A",
        1000,
        "cat-1",
        "Food",
        "#FF0000",
        100,
        new Date(),
        undefined
      ),
      new Transaction(
        "2",
        userId,
        new Date("2024-02-15"),
        "Store B",
        2000,
        "cat-2",
        "Shop",
        "#00FF00",
        100,
        new Date(),
        undefined
      ),
    ];

    (transactionRepository.findByUserId as Mock<typeof transactionRepository.findByUserId>).mockResolvedValue(
      mockTransactions
    );

    // Act
    const result = await useCase.execute({ userId, year });

    // Assert
    expect(transactionRepository.findByUserId).toHaveBeenCalledWith(userId, { year, month: undefined });
    expect(result.summary.totalAmount).toBe(3000);
    expect(result.categoryBreakdown).toHaveLength(2);
    expect(result.monthlyBreakdown).toHaveLength(2);
  });
});

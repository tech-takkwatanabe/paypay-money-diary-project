import { describe, it, expect, mock, beforeEach, Mock } from "bun:test";
import { ListTransactionsUseCase } from "./listTransactionsUseCase";
import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { Transaction } from "@/domain/entity/transaction";

describe("ListTransactionsUseCase", () => {
  let useCase: ListTransactionsUseCase;
  let transactionRepository: ITransactionRepository;

  beforeEach(() => {
    transactionRepository = {
      findByUserId: mock().mockResolvedValue([]),
      countByUserId: mock().mockResolvedValue(0),
      sumByUserId: mock().mockResolvedValue(0),
    } as unknown as ITransactionRepository;

    useCase = new ListTransactionsUseCase(transactionRepository);
  });

  it("should return transactions with pagination", async () => {
    // Arrange
    const userId = "user-123";
    const query = { page: "2", limit: "10", year: "2024" };

    const mockTransactions = [
      new Transaction("1", userId, new Date(), "Store A", 1000, "cat-1", "Food", "#FF0000", 100, new Date(), undefined),
    ];

    (transactionRepository.findByUserId as Mock<typeof transactionRepository.findByUserId>).mockResolvedValue(
      mockTransactions
    );
    (transactionRepository.countByUserId as Mock<typeof transactionRepository.countByUserId>).mockResolvedValue(25);
    (transactionRepository.sumByUserId as Mock<typeof transactionRepository.sumByUserId>).mockResolvedValue(1000);

    // Act
    const result = await useCase.execute(userId, query);

    // Assert
    expect(transactionRepository.findByUserId).toHaveBeenCalledWith(userId, {
      year: 2024,
      month: undefined,
      categoryId: undefined,
      pagination: { page: 2, limit: 10 },
    });
    expect(transactionRepository.countByUserId).toHaveBeenCalledWith(userId, {
      year: 2024,
      month: undefined,
      categoryId: undefined,
      pagination: { page: 2, limit: 10 },
    });

    expect(transactionRepository.sumByUserId).toHaveBeenCalledWith(userId, {
      year: 2024,
      month: undefined,
      categoryId: undefined,
      pagination: { page: 2, limit: 10 },
    });

    expect(result.data).toHaveLength(1);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      totalCount: 25,
      totalAmount: 1000,
      totalPages: 3,
    });
  });
});

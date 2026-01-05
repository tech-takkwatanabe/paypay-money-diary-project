import { describe, it, expect, mock, beforeEach, Mock } from "bun:test";
import { ReCategorizeTransactionsUseCase } from "./reCategorizeTransactionsUseCase";
import { ITransactionRepository } from "@/domain/repository/transactionRepository";

describe("ReCategorizeTransactionsUseCase", () => {
  let useCase: ReCategorizeTransactionsUseCase;
  let transactionRepository: ITransactionRepository;

  beforeEach(() => {
    transactionRepository = {
      reCategorizeByRules: mock().mockResolvedValue(0),
    } as unknown as ITransactionRepository;

    useCase = new ReCategorizeTransactionsUseCase(transactionRepository);
  });

  it("should call reCategorizeByRules with correct parameters", async () => {
    // Arrange
    const userId = "user-123";
    const year = 2024;
    const month = 12;

    (
      transactionRepository.reCategorizeByRules as Mock<typeof transactionRepository.reCategorizeByRules>
    ).mockResolvedValue(5);

    // Act
    const result = await useCase.execute({ userId, year, month });

    // Assert
    expect(transactionRepository.reCategorizeByRules).toHaveBeenCalledWith(userId, year, month);
    expect(result.updatedCount).toBe(5);
  });
});

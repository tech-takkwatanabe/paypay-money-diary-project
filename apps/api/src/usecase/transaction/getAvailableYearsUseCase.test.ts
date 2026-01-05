import { describe, it, expect, mock, beforeEach, Mock } from "bun:test";
import { GetAvailableYearsUseCase } from "./getAvailableYearsUseCase";
import { ITransactionRepository } from "@/domain/repository/transactionRepository";

describe("GetAvailableYearsUseCase", () => {
  let useCase: GetAvailableYearsUseCase;
  let transactionRepository: ITransactionRepository;

  beforeEach(() => {
    transactionRepository = {
      getAvailableYears: mock().mockResolvedValue([]),
    } as unknown as ITransactionRepository;

    useCase = new GetAvailableYearsUseCase(transactionRepository);
  });

  it("should return available years", async () => {
    // Arrange
    const userId = "user-123";
    const mockYears = [2023, 2024];

    (transactionRepository.getAvailableYears as Mock<typeof transactionRepository.getAvailableYears>).mockResolvedValue(
      mockYears
    );

    // Act
    const result = await useCase.execute(userId);

    // Assert
    expect(transactionRepository.getAvailableYears).toHaveBeenCalledWith(userId);
    expect(result.years).toEqual(mockYears);
  });
});

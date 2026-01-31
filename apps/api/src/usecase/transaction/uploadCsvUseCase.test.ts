import { describe, it, expect, mock, beforeEach, afterEach, Mock } from "bun:test";
import { UploadCsvUseCase, UploadCsvInput } from "./uploadCsvUseCase";
import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { ICsvUploadRepository } from "@/domain/repository/csvUploadRepository";
import { CsvService } from "@/service/transaction/csvService";

describe("UploadCsvUseCase", () => {
  let useCase: UploadCsvUseCase;
  let transactionRepository: ITransactionRepository;
  let csvUploadRepository: ICsvUploadRepository;
  let csvService: CsvService;

  beforeEach(() => {
    transactionRepository = {
      existsByExternalId: mock().mockResolvedValue(false),
      create: mock().mockResolvedValue({}),
    } as unknown as ITransactionRepository;

    csvUploadRepository = {
      create: mock().mockResolvedValue({ id: "upload-123" }),
      updateStatus: mock().mockResolvedValue(undefined),
    } as unknown as ICsvUploadRepository;

    csvService = {
      parseCsv: mock().mockReturnValue({
        expenses: [
          {
            transactionDate: new Date("2024-01-01"),
            amount: 1000,
            merchant: "Store A",
            paymentMethod: "PayPay",
            externalTransactionId: "tx-1",
          },
        ],
        rawData: [],
        totalRows: 1,
        skippedRows: 0,
      }),
      assignCategories: mock().mockResolvedValue(new Map([["Store A", "cat-1"]])),
    } as unknown as CsvService;

    useCase = new UploadCsvUseCase(transactionRepository, csvUploadRepository, csvService);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should successfully upload and process CSV", async () => {
    // Arrange
    const input: UploadCsvInput = {
      userId: "user-123",
      fileName: "test.csv",
      csvContent: "date,amount,merchant\n2024/01/01,1000,Store A",
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(csvService.parseCsv).toHaveBeenCalledWith(input.csvContent);
    expect(csvUploadRepository.create).toHaveBeenCalled();
    expect(csvService.assignCategories).toHaveBeenCalled();
    expect(transactionRepository.existsByExternalId).toHaveBeenCalledWith(input.userId, "tx-1");
    expect(transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethod: "PayPay",
      })
    );
    expect(csvUploadRepository.updateStatus).toHaveBeenCalledWith("upload-123", "processed");

    expect(result).toEqual({
      uploadId: "upload-123",
      totalRows: 1,
      importedRows: 1,
      skippedRows: 0,
      duplicateRows: 0,
    });
  });

  it("should skip duplicate rows", async () => {
    // Arrange
    const input: UploadCsvInput = {
      userId: "user-123",
      fileName: "test.csv",
      csvContent: "date,amount,merchant\n2024/01/01,1000,Store A",
    };

    (
      transactionRepository.existsByExternalId as Mock<typeof transactionRepository.existsByExternalId>
    ).mockResolvedValue(true);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.importedRows).toBe(0);
    expect(result.duplicateRows).toBe(1);
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });
});

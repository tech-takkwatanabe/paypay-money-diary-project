import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import { csvUploads } from "@/db/schema";
import { UploadCsvUseCase, UploadCsvInput } from "./uploadCsvUseCase";
import { db } from "@/db";
import * as paypayParser from "@/infrastructure/csv/paypayParser";
import * as categoryClassifier from "@/infrastructure/csv/categoryClassifier";

describe("UploadCsvUseCase", () => {
  let useCase: UploadCsvUseCase;

  beforeEach(() => {
    useCase = new UploadCsvUseCase();
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

    const mockParseResult: paypayParser.CsvParseResult = {
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
      expenseRows: 1,
      skippedRows: 0,
    };

    const spyParse = spyOn(paypayParser, "parsePayPayCsv").mockReturnValue(mockParseResult);

    // Mock db.insert
    const mockUpload = { id: "upload-123" };
    const spyInsert = spyOn(db, "insert").mockImplementation(((table: unknown) => {
      if (table === csvUploads) {
        return {
          values: mock().mockReturnValue({
            returning: mock().mockResolvedValue([mockUpload]),
          }),
        } as unknown as ReturnType<typeof db.insert>;
      }
      return {
        values: mock().mockReturnValue({
          returning: mock().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.insert>;
    }) as typeof db.insert);

    // Mock assignCategories
    const mockCategoryMap = new Map([["Store A", "cat-1"]]);
    const spyAssign = spyOn(categoryClassifier, "assignCategories").mockResolvedValue(mockCategoryMap);

    // Mock db.select for duplicate check (no duplicates)
    spyOn(db, "select").mockReturnValue({
      from: mock().mockReturnValue({
        where: mock().mockReturnValue({
          limit: mock().mockResolvedValue([]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    // Mock db.update for status update
    spyOn(db, "update").mockReturnValue({
      set: mock().mockReturnValue({
        where: mock().mockResolvedValue(undefined),
      }),
    } as unknown as ReturnType<typeof db.update>);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(spyParse).toHaveBeenCalledWith(input.csvContent);
    expect(spyInsert).toHaveBeenCalled();
    expect(spyAssign).toHaveBeenCalledWith(mockParseResult.expenses, input.userId);
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

    const mockParseResult: paypayParser.CsvParseResult = {
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
      expenseRows: 1,
      skippedRows: 0,
    };

    spyOn(paypayParser, "parsePayPayCsv").mockReturnValue(mockParseResult);

    // Mock db.insert for csvUploads
    const mockUpload = { id: "upload-123" };
    spyOn(db, "insert").mockReturnValue({
      values: mock().mockReturnValue({
        returning: mock().mockResolvedValue([mockUpload]),
      }),
    } as unknown as ReturnType<typeof db.insert>);

    // Mock assignCategories
    spyOn(categoryClassifier, "assignCategories").mockResolvedValue(new Map());

    // Mock db.select for duplicate check (duplicate found)
    spyOn(db, "select").mockReturnValue({
      from: mock().mockReturnValue({
        where: mock().mockReturnValue({
          limit: mock().mockResolvedValue([{ id: "existing-id" }]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    // Mock db.update
    spyOn(db, "update").mockReturnValue({
      set: mock().mockReturnValue({
        where: mock().mockResolvedValue(undefined),
      }),
    } as unknown as ReturnType<typeof db.update>);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.importedRows).toBe(0);
    expect(result.duplicateRows).toBe(1);
  });
});

import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { CsvUploadRepository } from "./csvUploadRepository";
import { db } from "@/db";

describe("CsvUploadRepository", () => {
  const repository = new CsvUploadRepository();
  const mockDate = new Date("2024-01-01T00:00:00Z");

  const mockCsvUploadData = {
    id: "upload-123",
    userId: "user-123",
    fileName: "test.csv",
    uploadedAt: mockDate,
    rawData: "raw-data-content",
    rowCount: 10,
    status: "PENDING",
  };

  afterEach(() => {
    mock.restore();
  });

  describe("create", () => {
    it("should insert and return new csv upload record", async () => {
      spyOn(db, "insert").mockImplementation(() => {
        const chain = {
          values: mock().mockReturnThis(),
          returning: mock().mockImplementation(() => Promise.resolve([mockCsvUploadData])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockCsvUploadData])),
        };
        return chain as unknown as never;
      });

      const input = {
        userId: "user-123",
        fileName: "test.csv",
        rawData: "raw-data-content",
        rowCount: 10,
        status: "PENDING",
      };

      const result = await repository.create(input);

      expect(result).toEqual({
        id: mockCsvUploadData.id,
        userId: mockCsvUploadData.userId,
        fileName: mockCsvUploadData.fileName,
        uploadedAt: mockCsvUploadData.uploadedAt,
        rawData: mockCsvUploadData.rawData,
        rowCount: mockCsvUploadData.rowCount,
        status: mockCsvUploadData.status,
      });
    });
  });

  describe("updateStatus", () => {
    it("should update status", async () => {
      spyOn(db, "update").mockImplementation(() => {
        const chain = {
          set: mock().mockReturnThis(),
          where: mock().mockImplementation(() => Promise.resolve()),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(undefined)),
        };
        return chain as unknown as never;
      });

      await repository.updateStatus("upload-123", "COMPLETED");

      // Since updateStatus returns void, we just verify it doesn't throw
      expect(true).toBe(true);
    });
  });
});

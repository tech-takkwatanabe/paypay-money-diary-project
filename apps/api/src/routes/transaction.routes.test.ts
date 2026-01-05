import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { app } from "@/index";
import jwt from "jsonwebtoken";
import { ListTransactionsUseCase } from "@/usecase/transaction/listTransactionsUseCase";
import { GetTransactionSummaryUseCase } from "@/usecase/transaction/getTransactionSummaryUseCase";
import { ReCategorizeTransactionsUseCase } from "@/usecase/transaction/reCategorizeTransactionsUseCase";
import { GetAvailableYearsUseCase } from "@/usecase/transaction/getAvailableYearsUseCase";
import { UploadCsvUseCase } from "@/usecase/transaction/uploadCsvUseCase";

// Set test environment variables
process.env.JWT_ACCESS_SECRET = "test-secret";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";

describe("Transaction Routes", () => {
  const testUser = { userId: "user-123", email: "test@example.com" };
  const testToken = jwt.sign(testUser, process.env.JWT_ACCESS_SECRET!);

  afterEach(() => {
    mock.restore();
  });

  describe("POST /api/transactions/upload", () => {
    it("should return 201 on successful upload", async () => {
      // Arrange
      const spy = spyOn(UploadCsvUseCase.prototype, "execute").mockResolvedValue({
        uploadId: "upload-123",
        totalRows: 10,
        importedRows: 8,
        skippedRows: 1,
        duplicateRows: 1,
      });

      const formData = new FormData();
      formData.append("file", new Blob(["test csv content"], { type: "text/csv" }), "test.csv");

      // Act
      const res = await app.request("/api/transactions/upload", {
        method: "POST",
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
        body: formData,
      });

      // Assert
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.message).toBe("CSV uploaded successfully");
      expect(body.processedCount).toBe(8);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("GET /api/transactions", () => {
    it("should return 200 and transaction list", async () => {
      // Arrange
      const spy = spyOn(ListTransactionsUseCase.prototype, "execute").mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 50, totalCount: 0, totalPages: 0 },
      });

      // Act
      const res = await app.request("/api/transactions", {
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
      });

      // Assert
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("GET /api/transactions/summary", () => {
    it("should return 200 and summary data", async () => {
      // Arrange
      const spy = spyOn(GetTransactionSummaryUseCase.prototype, "execute").mockResolvedValue({
        summary: { totalAmount: 1000, transactionCount: 1 },
        categoryBreakdown: [],
        monthlyBreakdown: [],
      });

      // Act
      const res = await app.request("/api/transactions/summary?year=2024", {
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
      });

      // Assert
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.summary.totalAmount).toBe(1000);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("POST /api/transactions/re-categorize", () => {
    it("should return 200 on successful re-categorization", async () => {
      // Arrange
      const spy = spyOn(ReCategorizeTransactionsUseCase.prototype, "execute").mockResolvedValue({
        message: "Success",
        updatedCount: 5,
      });

      // Act
      const res = await app.request("/api/transactions/re-categorize", {
        method: "POST",
        headers: {
          Cookie: `accessToken=${testToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ year: 2024 }),
      });

      // Assert
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Success");
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("GET /api/transactions/available-years", () => {
    it("should return 200 and available years", async () => {
      // Arrange
      const spy = spyOn(GetAvailableYearsUseCase.prototype, "execute").mockResolvedValue({
        years: [2024],
      });

      // Act
      const res = await app.request("/api/transactions/available-years", {
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
      });

      // Assert
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.years).toEqual([2024]);
      expect(spy).toHaveBeenCalled();
    });
  });
});

import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { app } from "@/index";
import jwt from "jsonwebtoken";
import { UploadCsvUseCase } from "@/usecase/transaction/uploadCsvUseCase";
import { db } from "@/db";

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
      expect(body.uploadId).toBe("upload-123");
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("GET /api/transactions", () => {
    it("should return 200 and transaction list", async () => {
      // Arrange
      const mockTransactions = [
        {
          id: "1",
          transactionDate: new Date("2024-01-01"),
          amount: 1000,
          merchant: "Store A",
        },
      ];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          leftJoin: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockReturnThis(),
          limit: mock().mockReturnThis(),
          offset: mock().mockImplementation(() => Promise.resolve(mockTransactions)),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([{ count: 1 }])),
        };
        return chain as unknown as never;
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
      expect(body.data).toHaveLength(1);
    });
  });

  describe("GET /api/transactions/summary", () => {
    it("should return 200 and summary data", async () => {
      // Arrange
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          leftJoin: mock().mockReturnThis(),
          groupBy: mock().mockImplementation(() => Promise.resolve([{ totalAmount: 1000, transactionCount: 1 }])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) =>
            resolve([{ totalAmount: 1000, transactionCount: 1 }])
          ),
        };
        return chain as unknown as never;
      });

      // Act
      const res = await app.request("/api/transactions/summary", {
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
      });

      // Assert
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.summary.totalAmount).toBe(1000);
    });
  });

  describe("POST /api/transactions/re-categorize", () => {
    it("should return 200 on successful re-categorization", async () => {
      // Arrange
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve([])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([])),
        };
        return chain as unknown as never;
      });

      // Act
      const res = await app.request("/api/transactions/re-categorize", {
        method: "POST",
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
      });

      // Assert
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("No rules found");
    });
  });

  describe("GET /api/transactions/years", () => {
    it("should return 200 and available years", async () => {
      // Arrange
      const mockUploads = [{ fileName: "Transactions_20240101-20241231.csv" }];
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockImplementation(() => Promise.resolve(mockUploads)),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(mockUploads)),
        };
        return chain as unknown as never;
      });

      // Act
      const res = await app.request("/api/transactions/years", {
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
      });

      // Assert
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.years).toEqual([2024]);
    });
  });
});

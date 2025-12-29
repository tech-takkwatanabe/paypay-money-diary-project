import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
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

  beforeEach(() => {
    // No-op
  });

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
      expect(body).toEqual({
        message: "CSV uploaded successfully",
        uploadId: "upload-123",
        totalRows: 10,
        importedRows: 8,
        skippedRows: 1,
        duplicateRows: 1,
      });
      expect(spy).toHaveBeenCalled();
    });

    it("should return 400 if file is missing", async () => {
      // Act
      const res = await app.request("/api/transactions/upload", {
        method: "POST",
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
        body: new FormData(),
      });

      // Assert
      expect(res.status).toBe(400);
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
          paymentMethod: "PayPay",
          categoryId: "cat-1",
          categoryName: "Food",
          categoryColor: "#ff0000",
        },
      ];

      const spySelect = spyOn(db, "select").mockReturnValue({
        from: mock().mockReturnValue({
          leftJoin: mock().mockReturnValue({
            where: mock().mockReturnValue({
              orderBy: mock().mockReturnValue({
                limit: mock().mockReturnValue({
                  offset: mock().mockResolvedValue(mockTransactions),
                }),
              }),
            }),
          }),
          where: mock().mockReturnValue({
            // For count query
            then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([{ count: 1 }])),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

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
      expect(body.data[0].merchant).toBe("Store A");
      expect(spySelect).toHaveBeenCalled();
    });
  });
});

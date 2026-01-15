import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import { registerTransactionRoutes } from "./transaction.routes";
import { Env } from "@/types/hono";
import { ListTransactionsUseCase } from "@/usecase/transaction/listTransactionsUseCase";
import { GetTransactionSummaryUseCase } from "@/usecase/transaction/getTransactionSummaryUseCase";
import { UpdateTransactionUseCase } from "@/usecase/transaction/updateTransactionUseCase";
import { ReCategorizeTransactionsUseCase } from "@/usecase/transaction/reCategorizeTransactionsUseCase";
import { GetAvailableYearsUseCase } from "@/usecase/transaction/getAvailableYearsUseCase";
import { UploadCsvUseCase } from "@/usecase/transaction/uploadCsvUseCase";

describe("TransactionController", () => {
  let app: OpenAPIHono<Env>;

  beforeEach(() => {
    app = new OpenAPIHono<Env>();
    // 認証モック
    app.use("*", async (c, next) => {
      c.set("user", { userId: "user-123", email: "test@example.com" });
      await next();
    });
    registerTransactionRoutes(app);

    // ユースケースをスパイ/モック
    spyOn(ListTransactionsUseCase.prototype, "execute").mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 50, totalCount: 0, totalAmount: 0, totalPages: 0 },
    });
    spyOn(GetTransactionSummaryUseCase.prototype, "execute").mockResolvedValue({
      summary: { totalAmount: 0, transactionCount: 0 },
      categoryBreakdown: [],
      monthlyBreakdown: [],
    });
    spyOn(UpdateTransactionUseCase.prototype, "execute").mockResolvedValue({
      id: "1",
      userId: "user-123",
      date: new Date().toISOString(),
      description: "Test",
      amount: 1000,
      categoryId: "cat-1",
      categoryName: "Food",
      categoryColor: "#FF0000",
      displayOrder: 1,
      paymentMethod: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    spyOn(ReCategorizeTransactionsUseCase.prototype, "execute").mockResolvedValue({
      message: "Success",
      updatedCount: 5,
    });
    spyOn(GetAvailableYearsUseCase.prototype, "execute").mockResolvedValue({ years: [2024] });
    spyOn(UploadCsvUseCase.prototype, "execute").mockResolvedValue({
      uploadId: "1",
      importedRows: 10,
      totalRows: 10,
      skippedRows: 0,
      duplicateRows: 0,
    });
  });

  afterEach(() => {
    mock.restore();
  });

  it("GET / should call ListTransactionsUseCase", async () => {
    const res = await app.request("/transactions?page=1&limit=50");
    expect(res.status).toBe(200);
  });

  it("GET /summary should call GetTransactionSummaryUseCase", async () => {
    const res = await app.request("/transactions/summary?year=2024");
    expect(res.status).toBe(200);
  });

  it("PUT /:id should call UpdateTransactionUseCase", async () => {
    const res = await app.request("/transactions/550e8400-e29b-41d4-a716-446655440000", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: "550e8400-e29b-41d4-a716-446655440001" }),
    });
    expect(res.status).toBe(200);
  });

  it("POST /re-categorize should call ReCategorizeTransactionsUseCase", async () => {
    const res = await app.request("/transactions/re-categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: 2024 }),
    });
    expect(res.status).toBe(200);
  });

  it("GET /available-years should call GetAvailableYearsUseCase", async () => {
    const res = await app.request("/transactions/available-years");
    expect(res.status).toBe(200);
  });

  it("POST /upload should call UploadCsvUseCase", async () => {
    const formData = new FormData();
    const file = new File(["date,amount,merchant\n2024/01/01,1000,Store A"], "test.csv", { type: "text/csv" });
    formData.append("file", file);

    const res = await app.request("/transactions/upload", {
      method: "POST",
      body: formData,
    });
    expect(res.status).toBe(201);
  });
});

import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { getTransactionsHandler } from "./list";
import { db } from "@/db";

describe("getTransactionsHandler", () => {
  let app: Hono<{ Variables: { user: { userId: string; email: string } } }>;
  const testUser = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    app = new Hono<{ Variables: { user: { userId: string; email: string } } }>();
    app.use("*", async (c, next) => {
      c.set("user", testUser);
      await next();
    });
    app.get("/transactions", getTransactionsHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 200 and list of transactions", async () => {
    // Arrange
    const mockTransactions = [{ id: "1", transactionDate: new Date("2024-01-01"), amount: 1000, merchant: "Store A" }];

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
    const res = await app.request("/transactions");

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.pagination.totalCount).toBe(1);
  });
});

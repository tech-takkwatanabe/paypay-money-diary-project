import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { getTransactionsSummaryHandler } from "./summary";
import { db } from "@/db";

describe("getTransactionsSummaryHandler", () => {
  let app: Hono<{ Variables: { user: { userId: string; email: string } } }>;
  const testUser = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    app = new Hono<{ Variables: { user: { userId: string; email: string } } }>();
    app.use("*", async (c, next) => {
      c.set("user", testUser);
      await next();
    });
    app.get("/summary", getTransactionsSummaryHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 200 and summary data", async () => {
    // Arrange
    const mockCategoryBreakdown = [
      { categoryId: "cat-1", categoryName: "Food", categoryColor: "#ff0000", totalAmount: 1000, transactionCount: 1 },
    ];
    const mockTotal = [{ totalAmount: 1000, transactionCount: 1 }];

    spyOn(db, "select").mockImplementation(() => {
      const chain = {
        from: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        leftJoin: mock().mockReturnThis(),
        groupBy: mock().mockImplementation(() => Promise.resolve(mockCategoryBreakdown)),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(mockTotal)),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/summary");

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.totalAmount).toBe(1000);
    expect(body.categoryBreakdown).toHaveLength(1);
  });
});

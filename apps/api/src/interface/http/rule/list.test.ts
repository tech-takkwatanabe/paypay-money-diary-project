import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { getRulesHandler } from "./list";
import { db } from "@/db";

describe("getRulesHandler", () => {
  let app: Hono<{ Variables: { user: { userId: string; email: string } } }>;
  const testUser = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    app = new Hono<{ Variables: { user: { userId: string; email: string } } }>();
    app.use("*", async (c, next) => {
      c.set("user", testUser);
      await next();
    });
    app.get("/rules", getRulesHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 200 and list of rules", async () => {
    // Arrange
    const mockRules = [
      {
        id: "rule-1",
        keyword: "Amazon",
        categoryId: "cat-1",
        categoryName: "Shopping",
        priority: 0,
        userId: "user-123",
      },
      { id: "rule-2", keyword: "System", categoryId: "cat-2", categoryName: "Misc", priority: 1, userId: null },
    ];

    spyOn(db, "select").mockImplementation(() => {
      const chain = {
        from: mock().mockReturnThis(),
        innerJoin: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        orderBy: mock().mockImplementation(() => Promise.resolve(mockRules)),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(mockRules)),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/rules");

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0].isSystem).toBe(false);
    expect(body.data[1].isSystem).toBe(true);
  });
});

import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { reCategorizeHandler } from "./reCategorize";
import { db } from "@/db";

describe("reCategorizeHandler", () => {
  let app: Hono<{ Variables: { user: { userId: string; email: string } } }>;
  const testUser = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    app = new Hono<{ Variables: { user: { userId: string; email: string } } }>();
    app.use("*", async (c, next) => {
      c.set("user", testUser);
      await next();
    });
    app.post("/re-categorize", reCategorizeHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 200 on successful re-categorization", async () => {
    // Arrange
    const mockRules = [{ keyword: "Amazon", categoryId: "cat-1" }];
    const mockOtherCategory = { id: "cat-other", name: "その他" };

    spyOn(db, "select").mockImplementation(() => {
      const chain = {
        from: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        orderBy: mock().mockImplementation(() => Promise.resolve(mockRules)),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(mockRules)),
      };
      return chain as unknown as never;
    });

    spyOn(db.query.categories, "findFirst").mockResolvedValue(mockOtherCategory as unknown as never);

    spyOn(db, "update").mockImplementation(() => {
      const chain = {
        set: mock().mockReturnThis(),
        where: mock().mockImplementation(() => Promise.resolve()),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(undefined)),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/re-categorize", { method: "POST" });

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Re-categorization completed");
  });

  it("should return 200 with 'No rules found' if no rules exist", async () => {
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
    const res = await app.request("/re-categorize", { method: "POST" });

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("No rules found");
  });
});

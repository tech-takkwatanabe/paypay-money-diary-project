import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { createRuleHandler } from "./create";
import { db } from "@/db";

describe("createRuleHandler", () => {
  let app: Hono<{ Variables: { user: { userId: string; email: string } } }>;
  const testUser = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    app = new Hono<{ Variables: { user: { userId: string; email: string } } }>();
    app.use("*", async (c, next) => {
      c.set("user", testUser);
      await next();
    });
    app.post("/rules", createRuleHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 201 and created rule on success", async () => {
    // Arrange
    const mockCategory = { id: "cat-1", name: "Shopping" };
    const mockRule = { id: "rule-1", keyword: "Amazon", categoryId: "cat-1", priority: 0 };

    spyOn(db.query.categories, "findFirst").mockResolvedValue(mockCategory as unknown as never);
    spyOn(db, "insert").mockImplementation(() => {
      const chain = {
        values: mock().mockReturnThis(),
        returning: mock().mockImplementation(() => Promise.resolve([mockRule])),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockRule])),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: "Amazon", categoryId: "cat-1" }),
    });

    // Assert
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.keyword).toBe("Amazon");
    expect(body.categoryName).toBe("Shopping");
  });

  it("should return 400 if category not found", async () => {
    // Arrange
    spyOn(db.query.categories, "findFirst").mockResolvedValue(undefined as unknown as never);

    // Act
    const res = await app.request("/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: "Amazon", categoryId: "non-existent" }),
    });

    // Assert
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Category not found");
  });
});

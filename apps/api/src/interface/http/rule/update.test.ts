import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { updateRuleHandler } from "./update";
import { db } from "@/db";

describe("updateRuleHandler", () => {
  let app: Hono<{ Variables: { user: { userId: string; email: string } } }>;
  const testUser = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    app = new Hono<{ Variables: { user: { userId: string; email: string } } }>();
    app.use("*", async (c, next) => {
      c.set("user", testUser);
      await next();
    });
    app.put("/rules/:id", updateRuleHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 200 and updated rule on success", async () => {
    // Arrange
    const existingRule = { id: "rule-1", userId: "user-123", keyword: "Old", categoryId: "cat-1", priority: 0 };
    const updatedRule = { ...existingRule, keyword: "New" };
    const mockCategory = { id: "cat-1", name: "Shopping" };

    spyOn(db.query.categoryRules, "findFirst").mockResolvedValue(existingRule as unknown as never);
    spyOn(db.query.categories, "findFirst").mockResolvedValue(mockCategory as unknown as never);
    spyOn(db, "update").mockImplementation(() => {
      const chain = {
        set: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        returning: mock().mockImplementation(() => Promise.resolve([updatedRule])),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([updatedRule])),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/rules/rule-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: "New" }),
    });

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.keyword).toBe("New");
    expect(body.categoryName).toBe("Shopping");
  });

  it("should return 404 if rule not found or unauthorized", async () => {
    // Arrange
    spyOn(db.query.categoryRules, "findFirst").mockResolvedValue(undefined as unknown as never);

    // Act
    const res = await app.request("/rules/rule-not-found", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: "New" }),
    });

    // Assert
    expect(res.status).toBe(404);
  });
});

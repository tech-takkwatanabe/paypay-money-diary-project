import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { deleteRuleHandler } from "./delete";
import { db } from "@/db";

describe("deleteRuleHandler", () => {
  let app: Hono<{ Variables: { user: { userId: string; email: string } } }>;
  const testUser = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    app = new Hono<{ Variables: { user: { userId: string; email: string } } }>();
    app.use("*", async (c, next) => {
      c.set("user", testUser);
      await next();
    });
    app.delete("/rules/:id", deleteRuleHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 200 on successful deletion", async () => {
    // Arrange
    spyOn(db.query.categoryRules, "findFirst").mockResolvedValue({
      id: "rule-1",
      userId: "user-123",
    } as unknown as never);
    spyOn(db, "delete").mockImplementation(() => {
      const chain = {
        where: mock().mockReturnThis(),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(undefined)),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/rules/rule-1", {
      method: "DELETE",
    });

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Rule deleted successfully");
  });

  it("should return 404 if rule not found or unauthorized", async () => {
    // Arrange
    spyOn(db.query.categoryRules, "findFirst").mockResolvedValue(undefined as unknown as never);

    // Act
    const res = await app.request("/rules/rule-not-found", {
      method: "DELETE",
    });

    // Assert
    expect(res.status).toBe(404);
  });
});

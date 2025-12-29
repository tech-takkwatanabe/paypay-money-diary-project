import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { deleteCategoryHandler } from "./delete";
import { db } from "@/db";

describe("deleteCategoryHandler", () => {
  let app: Hono<{ Variables: { user: { userId: string; email: string } } }>;
  const testUser = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    app = new Hono<{ Variables: { user: { userId: string; email: string } } }>();
    app.use("*", async (c, next) => {
      c.set("user", testUser);
      await next();
    });
    app.delete("/categories/:id", deleteCategoryHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 200 on successful deletion", async () => {
    // Arrange
    spyOn(db, "select").mockImplementation(() => {
      const chain = {
        from: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        limit: mock().mockImplementation(() => Promise.resolve([{ id: "cat-1", userId: "user-123" }])),
        then: mock().mockImplementation((resolve: (val: unknown) => void) =>
          resolve([{ id: "cat-1", userId: "user-123" }])
        ),
      };
      return chain as unknown as never;
    });

    spyOn(db, "delete").mockImplementation(() => {
      const chain = {
        where: mock().mockImplementation(() => Promise.resolve()),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(undefined)),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/categories/cat-1", {
      method: "DELETE",
    });

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Category deleted successfully");
  });

  it("should return 404 if category not found", async () => {
    // Arrange
    spyOn(db, "select").mockImplementation(() => {
      const chain = {
        from: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        limit: mock().mockImplementation(() => Promise.resolve([])),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([])),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/categories/cat-not-found", {
      method: "DELETE",
    });

    // Assert
    expect(res.status).toBe(404);
  });

  it("should return 403 if trying to delete system category", async () => {
    // Arrange
    spyOn(db, "select").mockImplementation(() => {
      const chain = {
        from: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        limit: mock().mockImplementation(() => Promise.resolve([{ id: "cat-sys", userId: null }])),
        then: mock().mockImplementation((resolve: (val: unknown) => void) =>
          resolve([{ id: "cat-sys", userId: null }])
        ),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/categories/cat-sys", {
      method: "DELETE",
    });

    // Assert
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Cannot delete system category");
  });

  it("should return 403 if trying to delete other user's category", async () => {
    // Arrange
    spyOn(db, "select").mockImplementation(() => {
      const chain = {
        from: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        limit: mock().mockImplementation(() => Promise.resolve([{ id: "cat-other", userId: "other-user" }])),
        then: mock().mockImplementation((resolve: (val: unknown) => void) =>
          resolve([{ id: "cat-other", userId: "other-user" }])
        ),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/categories/cat-other", {
      method: "DELETE",
    });

    // Assert
    expect(res.status).toBe(403);
  });
});

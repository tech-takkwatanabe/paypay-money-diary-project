import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { updateCategoryHandler } from "./update";
import { db } from "@/db";

describe("updateCategoryHandler", () => {
  let app: Hono<{ Variables: { user: { userId: string; email: string } } }>;
  const testUser = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    app = new Hono<{ Variables: { user: { userId: string; email: string } } }>();
    app.use("*", async (c, next) => {
      c.set("user", testUser);
      await next();
    });
    app.put("/categories/:id", updateCategoryHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 200 and updated category on success", async () => {
    // Arrange
    const mockCategory = { id: "cat-1", userId: "user-123", name: "Old Name" };
    const updatedCategory = { ...mockCategory, name: "New Name", color: "#00ff00" };

    spyOn(db, "select").mockImplementation(() => {
      const chain = {
        from: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        limit: mock().mockImplementation(() => Promise.resolve([mockCategory])),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockCategory])),
      };
      return chain as unknown as never;
    });

    spyOn(db, "update").mockImplementation(() => {
      const chain = {
        set: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        returning: mock().mockImplementation(() => Promise.resolve([updatedCategory])),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([updatedCategory])),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/categories/cat-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name", color: "#00ff00" }),
    });

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("New Name");
  });

  it("should return 403 if trying to update system category", async () => {
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
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });

    // Assert
    expect(res.status).toBe(403);
  });

  it("should return 400 if no fields to update", async () => {
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

    // Act
    const res = await app.request("/categories/cat-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    // Assert
    expect(res.status).toBe(400);
  });
});

import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { createCategoryHandler } from "./create";
import { db } from "@/db";

describe("createCategoryHandler", () => {
  let app: Hono<{ Variables: { user: { userId: string; email: string } } }>;
  const testUser = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    app = new Hono<{ Variables: { user: { userId: string; email: string } } }>();
    app.use("*", async (c, next) => {
      c.set("user", testUser);
      await next();
    });
    app.post("/categories", createCategoryHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 201 and created category on success", async () => {
    // Arrange
    const mockCategory = {
      id: "cat-123",
      name: "Food",
      color: "#ff0000",
      icon: "utensils",
      displayOrder: 1,
      isDefault: false,
    };

    spyOn(db, "insert").mockImplementation(() => {
      const chain = {
        values: mock().mockReturnThis(),
        returning: mock().mockImplementation(() => Promise.resolve([mockCategory])),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockCategory])),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Food",
        color: "#ff0000",
        icon: "utensils",
        displayOrder: 1,
      }),
    });

    // Assert
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual(mockCategory);
  });

  it("should return 400 on validation error", async () => {
    // Act
    const res = await app.request("/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "", // Invalid: empty name
        color: "invalid-color",
      }),
    });

    // Assert
    expect(res.status).toBe(400);
  });

  it("should return 409 if category name already exists", async () => {
    // Arrange
    spyOn(db, "insert").mockImplementation(() => {
      throw new Error("duplicate key value violates unique constraint");
    });

    // Act
    const res = await app.request("/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Food",
        color: "#ff0000",
      }),
    });

    // Assert
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Category with this name already exists");
  });

  it("should return 401 if user is not in context", async () => {
    // Arrange
    const appNoAuth = new Hono();
    appNoAuth.post("/categories", createCategoryHandler);

    // Act
    const res = await appNoAuth.request("/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Food", color: "#ff0000" }),
    });

    // Assert
    expect(res.status).toBe(401);
  });
});

import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { getCategoriesHandler } from "./list";
import { db } from "@/db";

describe("getCategoriesHandler", () => {
  let app: Hono<{ Variables: { user: { userId: string; email: string } } }>;
  const testUser = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    app = new Hono<{ Variables: { user: { userId: string; email: string } } }>();
    app.use("*", async (c, next) => {
      c.set("user", testUser);
      await next();
    });
    app.get("/categories", getCategoriesHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 200 and list of categories", async () => {
    // Arrange
    const mockCategories = [
      {
        id: "cat-1",
        name: "Food",
        color: "#ff0000",
        icon: "utensils",
        displayOrder: 1,
        isDefault: false,
        isSystem: false,
      },
      { id: "cat-2", name: "Rent", color: "#0000ff", icon: "home", displayOrder: 2, isDefault: true, isSystem: true },
    ];

    spyOn(db, "select").mockImplementation(() => {
      const chain = {
        from: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        orderBy: mock().mockImplementation(() => Promise.resolve(mockCategories)),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(mockCategories)),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/categories");

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0].name).toBe("Food");
  });

  it("should return 500 on database error", async () => {
    // Arrange
    spyOn(db, "select").mockImplementation(() => {
      throw new Error("DB Error");
    });

    // Act
    const res = await app.request("/categories");

    // Assert
    expect(res.status).toBe(500);
  });
});

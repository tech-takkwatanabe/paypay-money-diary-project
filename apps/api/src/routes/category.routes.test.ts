import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { app } from "@/index";
import { db } from "@/db";
import jwt from "jsonwebtoken";

// Set test environment variables
process.env.JWT_ACCESS_SECRET = "test-secret";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";

describe("Category Routes", () => {
  const testUser = { userId: "user-123", email: "test@example.com" };
  const testToken = jwt.sign(testUser, process.env.JWT_ACCESS_SECRET!);

  afterEach(() => {
    mock.restore();
  });

  describe("GET /api/categories", () => {
    it("should route to getCategoriesHandler", async () => {
      const mockCategories = [{ id: "cat-1", name: "Food" }];
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(mockCategories)),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(mockCategories)),
        };
        return chain as unknown as never;
      });

      const res = await app.request("/api/categories", {
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
    });
  });

  describe("POST /api/categories", () => {
    it("should route to createCategoryHandler", async () => {
      const mockCategory = { id: "cat-new", name: "New" };
      spyOn(db, "insert").mockImplementation(() => {
        const chain = {
          values: mock().mockReturnThis(),
          returning: mock().mockImplementation(() => Promise.resolve([mockCategory])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockCategory])),
        };
        return chain as unknown as never;
      });

      const res = await app.request("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `accessToken=${testToken}`,
        },
        body: JSON.stringify({ name: "New", color: "#ff0000" }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBe("cat-new");
    });
  });

  describe("PUT /api/categories/:id", () => {
    it("should route to updateCategoryHandler", async () => {
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

      spyOn(db, "update").mockImplementation(() => {
        const chain = {
          set: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          returning: mock().mockImplementation(() => Promise.resolve([{ id: "cat-1", name: "Updated" }])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) =>
            resolve([{ id: "cat-1", name: "Updated" }])
          ),
        };
        return chain as unknown as never;
      });

      const res = await app.request("/api/categories/cat-1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `accessToken=${testToken}`,
        },
        body: JSON.stringify({ name: "Updated" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe("Updated");
    });
  });

  describe("DELETE /api/categories/:id", () => {
    it("should route to deleteCategoryHandler", async () => {
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

      const res = await app.request("/api/categories/cat-1", {
        method: "DELETE",
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
      });

      expect(res.status).toBe(200);
    });
  });
});

import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { app } from "@/index";
import { db } from "@/db";
import jwt from "jsonwebtoken";

// Set test environment variables
process.env.JWT_ACCESS_SECRET = "test-secret";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";

describe("Rule Routes", () => {
  const testUser = { userId: "user-123", email: "test@example.com" };
  const testToken = jwt.sign(testUser, process.env.JWT_ACCESS_SECRET!);

  afterEach(() => {
    mock.restore();
  });

  describe("GET /api/rules", () => {
    it("should route to getRulesHandler", async () => {
      const mockRules = [{ id: "rule-1", keyword: "Amazon", categoryName: "Shopping" }];
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

      const res = await app.request("/api/rules", {
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
    });
  });

  describe("POST /api/rules", () => {
    it("should route to createRuleHandler", async () => {
      const mockRule = { id: "rule-new", keyword: "New" };

      spyOn(db.query.categories, "findFirst").mockResolvedValue({ id: "cat-1", name: "Shopping" } as unknown as never);

      spyOn(db, "insert").mockImplementation(() => {
        const chain = {
          values: mock().mockReturnThis(),
          returning: mock().mockImplementation(() => Promise.resolve([mockRule])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockRule])),
        };
        return chain as unknown as never;
      });

      const res = await app.request("/api/rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `accessToken=${testToken}`,
        },
        body: JSON.stringify({ keyword: "New", categoryId: "cat-1" }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBe("rule-new");
    });
  });

  describe("PUT /api/rules/:id", () => {
    it("should route to updateRuleHandler", async () => {
      spyOn(db.query.categoryRules, "findFirst").mockResolvedValue({
        id: "rule-1",
        userId: "user-123",
        categoryId: "cat-1",
      } as unknown as never);
      spyOn(db.query.categories, "findFirst").mockResolvedValue({ id: "cat-1", name: "Shopping" } as unknown as never);

      spyOn(db, "update").mockImplementation(() => {
        const chain = {
          set: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          returning: mock().mockImplementation(() => Promise.resolve([{ id: "rule-1", keyword: "Updated" }])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) =>
            resolve([{ id: "rule-1", keyword: "Updated" }])
          ),
        };
        return chain as unknown as never;
      });

      const res = await app.request("/api/rules/rule-1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `accessToken=${testToken}`,
        },
        body: JSON.stringify({ keyword: "Updated" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.keyword).toBe("Updated");
    });
  });

  describe("DELETE /api/rules/:id", () => {
    it("should route to deleteRuleHandler", async () => {
      spyOn(db.query.categoryRules, "findFirst").mockResolvedValue({
        id: "rule-1",
        userId: "user-123",
      } as unknown as never);

      spyOn(db, "delete").mockImplementation(() => {
        const chain = {
          where: mock().mockImplementation(() => Promise.resolve()),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(undefined)),
        };
        return chain as unknown as never;
      });

      const res = await app.request("/api/rules/rule-1", {
        method: "DELETE",
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
      });

      expect(res.status).toBe(200);
    });
  });
});

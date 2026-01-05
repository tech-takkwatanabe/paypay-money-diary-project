import { describe, it, expect, beforeEach, afterEach, spyOn, mock } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import { registerRuleRoutes } from "./rule.routes";
import { ListRulesUseCase } from "@/usecase/rule/listRulesUseCase";
import { CreateRuleUseCase } from "@/usecase/rule/createRuleUseCase";
import { UpdateRuleUseCase } from "@/usecase/rule/updateRuleUseCase";
import { DeleteRuleUseCase } from "@/usecase/rule/deleteRuleUseCase";
import { Rule } from "@/domain/entity/rule";

type Env = {
  Variables: {
    user: { userId: string };
  };
};

describe("RuleController", () => {
  let app: OpenAPIHono<Env>;
  const userId = "550e8400-e29b-41d4-a716-446655440001";
  const categoryId = "550e8400-e29b-41d4-a716-446655440002";
  const ruleId = "550e8400-e29b-41d4-a716-446655440000";

  const mockRule = new Rule(ruleId, userId, "keyword-1", categoryId, 10, new Date(), new Date(), "Food");

  beforeEach(() => {
    app = new OpenAPIHono<Env>();
    // 認証ミドルウェアのモック
    app.use("*", async (c, next) => {
      c.set("user", { userId });
      await next();
    });
    registerRuleRoutes(app);
  });

  afterEach(() => {
    mock.restore();
  });

  describe("GET /rules", () => {
    it("should return rules list", async () => {
      const spy = spyOn(ListRulesUseCase.prototype, "execute").mockResolvedValue([mockRule]);

      const res = await app.request("/rules");
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ data: [mockRule.toResponse()] });
      expect(spy).toHaveBeenCalledWith(userId);
    });
  });

  describe("POST /rules", () => {
    it("should create a rule", async () => {
      const spy = spyOn(CreateRuleUseCase.prototype, "execute").mockResolvedValue(mockRule);
      const input = { keyword: "keyword-1", categoryId, priority: 10 };

      const res = await app.request("/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body).toEqual(mockRule.toResponse());
      expect(spy).toHaveBeenCalledWith(userId, expect.objectContaining(input));
    });
  });

  describe("PUT /rules/:id", () => {
    it("should update a rule", async () => {
      const spy = spyOn(UpdateRuleUseCase.prototype, "execute").mockResolvedValue(mockRule);
      const input = { keyword: "updated" };

      const res = await app.request(`/rules/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(mockRule.toResponse());
      expect(spy).toHaveBeenCalledWith(ruleId, userId, expect.objectContaining(input));
    });

    it("should return 403 when modifying system rule", async () => {
      spyOn(UpdateRuleUseCase.prototype, "execute").mockRejectedValue(
        new Error("Forbidden: Cannot update system rules")
      );

      const res = await app.request(`/rules/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: "new" }),
      });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "Forbidden: Cannot update system rules" });
    });
  });

  describe("DELETE /rules/:id", () => {
    it("should delete a rule", async () => {
      const spy = spyOn(DeleteRuleUseCase.prototype, "execute").mockResolvedValue(undefined);

      const res = await app.request(`/rules/${ruleId}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: "Rule deleted successfully" });
      expect(spy).toHaveBeenCalledWith(ruleId, userId);
    });

    it("should return 404 when rule not found", async () => {
      spyOn(DeleteRuleUseCase.prototype, "execute").mockRejectedValue(new Error("Rule not found"));

      const res = await app.request("/rules/none", {
        method: "DELETE",
      });

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Rule not found" });
    });
  });
});

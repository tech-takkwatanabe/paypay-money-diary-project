import { describe, it, expect, beforeEach, spyOn, afterEach } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import { registerCategoryRoutes } from "./category.routes";
import { Env } from "@/types/hono";
import { ListCategoriesUseCase } from "@/usecase/category/listCategoriesUseCase";
import { CreateCategoryUseCase } from "@/usecase/category/createCategoryUseCase";
import { UpdateCategoryUseCase } from "@/usecase/category/updateCategoryUseCase";
import { DeleteCategoryUseCase } from "@/usecase/category/deleteCategoryUseCase";
import { ReorderCategoriesUseCase } from "@/usecase/category/reorderCategoriesUseCase";
import { Category } from "@/domain/entity/category";

describe("CategoryController", () => {
  let app: OpenAPIHono<Env>;
  const mockUserId = "user-123";
  const mockUserEmail = "test@example.com";

  const mockCategory = new Category({
    id: "cat-1",
    name: "Food",
    color: "#FF0000",
    icon: "food",
    displayOrder: 0,
    isDefault: false,
    isOther: false,
    userId: mockUserId,
  });

  beforeEach(() => {
    app = new OpenAPIHono<Env>();
    // 認証ミドルウェアのモック
    app.use("*", async (c, next) => {
      c.set("user", { userId: mockUserId, email: mockUserEmail });
      await next();
    });
    registerCategoryRoutes(app);
  });

  afterEach(() => {
    // スパイをリセット
  });

  describe("GET /categories", () => {
    it("should return categories list", async () => {
      const spy = spyOn(ListCategoriesUseCase.prototype, "execute").mockResolvedValue([mockCategory]);

      const res = await app.request("/categories");
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ data: [mockCategory.toResponse()] });
      expect(spy).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe("POST /categories", () => {
    it("should create a category", async () => {
      const spy = spyOn(CreateCategoryUseCase.prototype, "execute").mockResolvedValue(mockCategory);
      const input = { name: "Food", color: "#FF0000", icon: "food", displayOrder: 0 };

      const res = await app.request("/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json();

      expect(res.status).toBe(201);
      // OpenAPI定義に合わせたレスポンス形式を確認
      expect(body).toEqual(mockCategory.toResponse());
      expect(spy).toHaveBeenCalledWith(mockUserId, expect.objectContaining(input));
    });

    it("should return 409 when name is duplicated", async () => {
      spyOn(CreateCategoryUseCase.prototype, "execute").mockRejectedValue(
        new Error("Category with this name already exists")
      );
      const input = { name: "Food", color: "#FF0000" };

      const res = await app.request("/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: "Category with this name already exists" });
    });
  });

  describe("PUT /categories/:id", () => {
    it("should update a category", async () => {
      const spy = spyOn(UpdateCategoryUseCase.prototype, "execute").mockResolvedValue(mockCategory);
      const input = { name: "Updated Food" };

      const res = await app.request("/categories/cat-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.name).toBe(mockCategory.name);
      expect(spy).toHaveBeenCalledWith("cat-1", mockUserId, expect.objectContaining(input));
    });

    it("should return 403 when modifying system category", async () => {
      spyOn(UpdateCategoryUseCase.prototype, "execute").mockRejectedValue(new Error("Cannot modify system category"));

      const res = await app.request("/categories/system-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "Cannot modify system category" });
    });
  });

  describe("DELETE /categories/:id", () => {
    it("should delete a category", async () => {
      const spy = spyOn(DeleteCategoryUseCase.prototype, "execute").mockResolvedValue(undefined);

      const res = await app.request("/categories/cat-1", {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: "Category deleted successfully" });
      expect(spy).toHaveBeenCalledWith("cat-1", mockUserId);
    });

    it("should return 404 when category not found", async () => {
      spyOn(DeleteCategoryUseCase.prototype, "execute").mockRejectedValue(new Error("Category not found"));

      const res = await app.request("/categories/none", {
        method: "DELETE",
      });

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Category not found" });
    });
  });

  describe("PATCH /categories/reorder", () => {
    it("should reorder categories successfully", async () => {
      const categoryIds = ["cat-1", "cat-2", "cat-3"];
      const spy = spyOn(ReorderCategoriesUseCase.prototype, "execute").mockResolvedValue(undefined);

      const res = await app.request("/categories/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categoryIds }),
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: "Categories reordered successfully" });
      expect(spy).toHaveBeenCalledWith(mockUserId, categoryIds);
    });

    it("should return 400 for duplicate category IDs", async () => {
      const categoryIds = ["cat-1", "cat-2", "cat-1"];
      spyOn(ReorderCategoriesUseCase.prototype, "execute").mockRejectedValue(
        new Error("Duplicate category IDs in reorder request")
      );

      const res = await app.request("/categories/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categoryIds }),
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: "Duplicate category IDs in reorder request",
      });
    });

    it("should return 400 for missing required categories", async () => {
      const categoryIds = ["cat-1"];
      spyOn(ReorderCategoriesUseCase.prototype, "execute").mockRejectedValue(
        new Error("Reorder list must include all categories except 'Others'")
      );

      const res = await app.request("/categories/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categoryIds }),
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: "Reorder list must include all categories except 'Others'",
      });
    });

    it("should return 401 when unauthorized", async () => {
      const res = await app.request("/categories/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categoryIds: ["cat-1"] }),
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Unauthorized" });
    });
  });
});

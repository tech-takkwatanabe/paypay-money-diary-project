import { Context } from "hono";
import { CategoryRepository } from "@/infrastructure/repository/categoryRepository";
import { RuleRepository } from "@/infrastructure/repository/ruleRepository";
import { CategoryService } from "@/service/category/categoryService";
import { ListCategoriesUseCase } from "@/usecase/category/listCategoriesUseCase";
import { CreateCategoryUseCase } from "@/usecase/category/createCategoryUseCase";
import { UpdateCategoryUseCase } from "@/usecase/category/updateCategoryUseCase";
import { DeleteCategoryUseCase } from "@/usecase/category/deleteCategoryUseCase";
import { ReorderCategoriesUseCase } from "@/usecase/category/reorderCategoriesUseCase";
import { CreateCategoryInput, UpdateCategoryInput, ReorderCategoriesInput } from "@paypay-money-diary/shared";

/**
 * Category Controller
 * カテゴリ関連のHTTPハンドラーを実装
 */
export class CategoryController {
  /**
   * カテゴリ一覧取得ハンドラー
   */
  async list(c: Context) {
    const userPayload = c.get("user");
    if (!userPayload || !userPayload.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const categoryRepository = new CategoryRepository();
    const listCategoriesUseCase = new ListCategoriesUseCase(categoryRepository);

    try {
      const categories = await listCategoriesUseCase.execute(userPayload.userId);
      return c.json({ data: categories.map((cat) => cat.toResponse()) }, 200);
    } catch (error) {
      console.error("List categories error:", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }

  /**
   * カテゴリ作成ハンドラー
   */
  async create(c: Context) {
    const userPayload = c.get("user");
    if (!userPayload || !userPayload.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const categoryRepository = new CategoryRepository();
    const createCategoryUseCase = new CreateCategoryUseCase(categoryRepository);

    const input = c.req.valid("json" as never) as CreateCategoryInput;

    try {
      const category = await createCategoryUseCase.execute(userPayload.userId, input);
      const response = category.toResponse();
      return c.json(response, 201);
    } catch (error) {
      if (error instanceof Error && error.message === "Category with this name already exists") {
        return c.json({ error: error.message }, 409);
      }
      console.error("Create category error:", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }

  /**
   * カテゴリ更新ハンドラー
   */
  async update(c: Context) {
    const userPayload = c.get("user");
    if (!userPayload || !userPayload.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const categoryId = c.req.param("id");
    if (!categoryId) {
      return c.json({ error: "Category ID is required" }, 400);
    }

    const categoryRepository = new CategoryRepository();
    const categoryService = new CategoryService(categoryRepository);
    const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepository, categoryService);

    const input = c.req.valid("json" as never) as UpdateCategoryInput;

    if (Object.keys(input).length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    try {
      const category = await updateCategoryUseCase.execute(categoryId, userPayload.userId, input);
      const response = category.toResponse();
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Category not found") return c.json({ error: error.message }, 404);
        if (error.message === "Unauthorized access to category") return c.json({ error: "Unauthorized" }, 403);
        if (error.message === "Cannot modify system category") return c.json({ error: error.message }, 403);
        if (error.message === "Category with this name already exists") return c.json({ error: error.message }, 409);
      }
      console.error("Update category error:", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }

  /**
   * カテゴリ並び替えハンドラー
   */
  async reorder(c: Context) {
    const userPayload = c.get("user");
    if (!userPayload || !userPayload.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const reorderCategoriesUseCase = new ReorderCategoriesUseCase();
    const input = c.req.valid("json" as never) as ReorderCategoriesInput;

    try {
      await reorderCategoriesUseCase.execute(userPayload.userId, input.categoryIds);
      return c.json({ message: "Categories reordered successfully" }, 200);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Unauthorized or invalid category ID")) {
          return c.json({ error: error.message }, 400);
        }
      }
      console.error("Reorder categories error:", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }

  /**
   * カテゴリ削除ハンドラー
   */
  async delete(c: Context) {
    const userPayload = c.get("user");
    if (!userPayload || !userPayload.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const categoryId = c.req.param("id");
    if (!categoryId) {
      return c.json({ error: "Category ID is required" }, 400);
    }

    const categoryRepository = new CategoryRepository();
    const ruleRepository = new RuleRepository();
    const categoryService = new CategoryService(categoryRepository);
    const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepository, ruleRepository, categoryService);

    try {
      await deleteCategoryUseCase.execute(categoryId, userPayload.userId);
      return c.json({ message: "Category deleted successfully" }, 200);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Category not found") {
          return c.json({ error: error.message }, 404);
        }
        if (error.message === "Unauthorized access to category") {
          return c.json({ error: "Unauthorized" }, 403);
        }
        if (error.message === "Cannot delete system category") {
          return c.json({ error: error.message }, 403);
        }
        if (error.message === "Cannot delete default category") {
          return c.json({ error: error.message }, 403);
        }
        if (error.message.startsWith("Cannot delete category linked to rules")) {
          return c.json({ error: error.message }, 400);
        }
        if (error.message.startsWith("Cannot delete category with existing transactions")) {
          return c.json({ error: error.message }, 400);
        }
      }
      console.error("Delete category error:", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }
}

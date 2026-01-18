import { describe, it, expect, beforeEach, mock, Mock } from "bun:test";
import { CategoryService } from "./categoryService";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Category } from "@/domain/entity/category";
import { CreateCategoryInput, UpdateCategoryInput } from "@paypay-money-diary/shared";

describe("CategoryService", () => {
  let categoryService: CategoryService;
  let mockCategoryRepository: ICategoryRepository;

  const userId = "user-1";
  const userCategory = new Category("user-cat-1", "My Hobby", "#00FF00", "hobby", 1, false, userId);
  const otherUserCategory = new Category("other-cat-1", "Other Hobby", "#0000FF", "hobby", 2, false, "other-user");
  const otherCategory = new Category("other-1", "その他", "#CCCCCC", "others", 9999, false, userId);

  beforeEach(() => {
    mockCategoryRepository = {
      findById: mock(async (_id: string) => null),
      findByUserId: mock(async (_userId: string) => []),
      findByName: mock(async (_userId: string, _name: string) => null),
      create: mock(async (_userId: string, _data: CreateCategoryInput) => ({}) as Category),
      update: mock(async (_id: string, _data: UpdateCategoryInput) => ({}) as Category),
      delete: mock(async (_id: string) => {}),
    };
    categoryService = new CategoryService(mockCategoryRepository);
  });

  describe("ensureUserCanAccess", () => {
    it("should allow access to own category", async () => {
      (mockCategoryRepository.findById as Mock<(_id: string) => Promise<Category | null>>).mockResolvedValue(
        userCategory
      );
      const result = await categoryService.ensureUserCanAccess("user-cat-1", userId);
      expect(result).toBe(userCategory);
    });

    it("should throw error when category not found", async () => {
      (mockCategoryRepository.findById as Mock<(_id: string) => Promise<Category | null>>).mockResolvedValue(null);
      expect(categoryService.ensureUserCanAccess("none", userId)).rejects.toThrow("Category not found");
    });

    it("should throw error when accessing other user's category", async () => {
      (mockCategoryRepository.findById as Mock<(_id: string) => Promise<Category | null>>).mockResolvedValue(
        otherUserCategory
      );
      expect(categoryService.ensureUserCanAccess("other-cat-1", userId)).rejects.toThrow(
        "Unauthorized access to category"
      );
    });
  });

  describe("ensureUserCanUpdate", () => {
    it("should allow updating own category", async () => {
      (mockCategoryRepository.findById as Mock<(_id: string) => Promise<Category | null>>).mockResolvedValue(
        userCategory
      );
      const result = await categoryService.ensureUserCanUpdate("user-cat-1", userId);
      expect(result).toBe(userCategory);
    });
  });

  describe("ensureUserCanDelete", () => {
    it("should allow deleting own non-other category", async () => {
      (mockCategoryRepository.findById as Mock<(_id: string) => Promise<Category | null>>).mockResolvedValue(
        userCategory
      );
      const result = await categoryService.ensureUserCanDelete("user-cat-1", userId);
      expect(result).toBe(userCategory);
    });

    it("should throw error when deleting 'その他' category", async () => {
      (mockCategoryRepository.findById as Mock<(_id: string) => Promise<Category | null>>).mockResolvedValue(
        otherCategory
      );
      expect(categoryService.ensureUserCanDelete("other-1", userId)).rejects.toThrow("Cannot delete 'その他' category");
    });
  });
});

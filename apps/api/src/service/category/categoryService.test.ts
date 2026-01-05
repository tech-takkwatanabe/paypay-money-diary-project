import { describe, it, expect, beforeEach, mock, Mock } from "bun:test";
import { CategoryService } from "./categoryService";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Category } from "@/domain/entity/category";
import { CreateCategoryInput, UpdateCategoryInput } from "@paypay-money-diary/shared";

describe("CategoryService", () => {
  let categoryService: CategoryService;
  let mockCategoryRepository: ICategoryRepository;

  const userId = "user-1";
  const systemCategory = new Category("system-1", "Food", "#FF0000", "food", 0, false, null);
  const userCategory = new Category("user-cat-1", "My Hobby", "#00FF00", "hobby", 1, false, userId);
  const otherUserCategory = new Category("other-cat-1", "Other Hobby", "#0000FF", "hobby", 2, false, "other-user");
  const defaultCategory = new Category("default-1", "Others", "#CCCCCC", "others", 99, true, userId);

  beforeEach(() => {
    mockCategoryRepository = {
      findById: mock(async (_id: string) => null),
      findByUserId: mock(async (_userId: string) => []),
      create: mock(async (_userId: string, _data: CreateCategoryInput) => ({}) as Category),
      update: mock(async (_id: string, _data: UpdateCategoryInput) => ({}) as Category),
      delete: mock(async (_id: string) => {}),
    };
    categoryService = new CategoryService(mockCategoryRepository);
  });

  describe("ensureUserCanAccess", () => {
    it("should allow access to system category", async () => {
      (mockCategoryRepository.findById as Mock<(_id: string) => Promise<Category | null>>).mockResolvedValue(
        systemCategory
      );
      const result = await categoryService.ensureUserCanAccess("system-1", userId);
      expect(result).toBe(systemCategory);
    });

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

    it("should throw error when updating system category", async () => {
      (mockCategoryRepository.findById as Mock<(_id: string) => Promise<Category | null>>).mockResolvedValue(
        systemCategory
      );
      expect(categoryService.ensureUserCanUpdate("system-1", userId)).rejects.toThrow("Cannot modify system category");
    });
  });

  describe("ensureUserCanDelete", () => {
    it("should allow deleting own non-default category", async () => {
      (mockCategoryRepository.findById as Mock<(_id: string) => Promise<Category | null>>).mockResolvedValue(
        userCategory
      );
      const result = await categoryService.ensureUserCanDelete("user-cat-1", userId);
      expect(result).toBe(userCategory);
    });

    it("should throw error when deleting system category", async () => {
      (mockCategoryRepository.findById as Mock<(_id: string) => Promise<Category | null>>).mockResolvedValue(
        systemCategory
      );
      expect(categoryService.ensureUserCanDelete("system-1", userId)).rejects.toThrow("Cannot delete system category");
    });

    it("should throw error when deleting default category", async () => {
      (mockCategoryRepository.findById as Mock<(_id: string) => Promise<Category | null>>).mockResolvedValue(
        defaultCategory
      );
      expect(categoryService.ensureUserCanDelete("default-1", userId)).rejects.toThrow(
        "Cannot delete default category"
      );
    });
  });
});

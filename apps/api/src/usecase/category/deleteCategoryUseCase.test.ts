import { describe, it, expect, beforeEach, mock } from "bun:test";
import { DeleteCategoryUseCase } from "./deleteCategoryUseCase";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { CategoryService } from "@/service/category/categoryService";
import { Category } from "@/domain/entity/category";
import { CreateCategoryInput, UpdateCategoryInput } from "@paypay-money-diary/shared";

describe("DeleteCategoryUseCase", () => {
  let useCase: DeleteCategoryUseCase;
  let mockCategoryRepository: ICategoryRepository;
  let mockCategoryService: CategoryService;

  const userId = "user-1";
  const categoryId = "cat-1";
  const category = new Category({
    id: categoryId,
    name: "Food",
    color: "#FF0000",
    icon: "food",
    displayOrder: 0,
    isDefault: false,
    isOther: false,
    userId: userId,
  });

  beforeEach(() => {
    mockCategoryRepository = {
      findById: mock(async (_id: string) => null),
      findByUserId: mock(async (_userId: string) => []),
      findByName: mock(async (_userId: string, _name: string) => null),
      create: mock(async (_userId: string, _data: CreateCategoryInput) => ({}) as Category),
      createInternal: mock(async (_userId: string, _data) => ({}) as Category),
      update: mock(async (_id: string, _data: UpdateCategoryInput) => ({}) as Category),
      delete: mock(async (_id: string) => {}),
      reorder: mock(async () => {}),
    };
    mockCategoryService = new CategoryService(mockCategoryRepository);
    mockCategoryService.ensureUserCanDelete = mock(async (_id: string, _userId: string) => category);

    useCase = new DeleteCategoryUseCase(mockCategoryRepository, mockCategoryService);
  });

  it("should delete a category successfully", async () => {
    await useCase.execute(categoryId, userId);

    expect(mockCategoryService.ensureUserCanDelete).toHaveBeenCalledWith(categoryId, userId);
    expect(mockCategoryRepository.delete).toHaveBeenCalledWith(categoryId);
  });

  it("should throw error if category is linked to rules", async () => {
    const categoryWithRules = new Category({
      id: categoryId,
      name: "Food",
      color: "#FF0000",
      icon: "food",
      displayOrder: 0,
      isDefault: false,
      isOther: false,
      userId: userId,
      hasRules: true,
    });
    mockCategoryService.ensureUserCanDelete = mock(async (_id: string, _userId: string) => categoryWithRules);

    await expect(useCase.execute(categoryId, userId)).rejects.toThrow(
      "Cannot delete category linked to rules. Please delete or update the rules first."
    );
    expect(mockCategoryRepository.delete).not.toHaveBeenCalled();
  });

  it("should throw error if category has transactions", async () => {
    const categoryWithTransactions = new Category({
      id: categoryId,
      name: "Food",
      color: "#FF0000",
      icon: "food",
      displayOrder: 0,
      isDefault: false,
      isOther: false,
      userId: userId,
      hasTransactions: true,
    });
    mockCategoryService.ensureUserCanDelete = mock(async (_id: string, _userId: string) => categoryWithTransactions);

    expect(useCase.execute(categoryId, userId)).rejects.toThrow(
      "Cannot delete category with existing transactions. Please delete or re-categorize the transactions first."
    );
    expect(mockCategoryRepository.delete).not.toHaveBeenCalled();
  });
});

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
  const category = new Category(categoryId, "Food", "#FF0000", "food", 0, false, userId);

  beforeEach(() => {
    mockCategoryRepository = {
      findById: mock(async (_id: string) => null),
      findByUserId: mock(async (_userId: string) => []),
      create: mock(async (_userId: string, _data: CreateCategoryInput) => ({}) as Category),
      update: mock(async (_id: string, _data: UpdateCategoryInput) => ({}) as Category),
      delete: mock(async (_id: string) => {}),
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
});

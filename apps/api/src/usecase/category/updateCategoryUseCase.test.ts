import { describe, it, expect, beforeEach, mock, Mock } from "bun:test";
import { UpdateCategoryUseCase } from "./updateCategoryUseCase";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { CategoryService } from "@/service/category/categoryService";
import { Category } from "@/domain/entity/category";
import { CreateCategoryInput, UpdateCategoryInput } from "@paypay-money-diary/shared";

describe("UpdateCategoryUseCase", () => {
  let useCase: UpdateCategoryUseCase;
  let mockCategoryRepository: ICategoryRepository;
  let mockCategoryService: CategoryService;

  const userId = "user-1";
  const categoryId = "cat-1";
  const input: UpdateCategoryInput = { name: "Updated Name" };
  const updatedCategory = new Category({
    id: categoryId,
    name: "Updated Name",
    color: "#FF0000",
    icon: "star",
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
      update: mock(async (_id: string, _data: UpdateCategoryInput) => ({}) as Category),
      delete: mock(async (_id: string) => {}),
    };
    mockCategoryService = new CategoryService(mockCategoryRepository);
    mockCategoryService.ensureUserCanUpdate = mock(async (_id: string, _userId: string) => updatedCategory);

    useCase = new UpdateCategoryUseCase(mockCategoryRepository, mockCategoryService);
  });

  it("should update a category successfully", async () => {
    (
      mockCategoryRepository.update as Mock<(_id: string, _data: UpdateCategoryInput) => Promise<Category>>
    ).mockResolvedValue(updatedCategory);

    const result = await useCase.execute(categoryId, userId, input);

    expect(result).toBe(updatedCategory);
    expect(mockCategoryService.ensureUserCanUpdate).toHaveBeenCalledWith(categoryId, userId);
    expect(mockCategoryRepository.update).toHaveBeenCalledWith(categoryId, input);
  });

  it("should throw error when category name is duplicated", async () => {
    (
      mockCategoryRepository.findByName as Mock<(_userId: string, _name: string) => Promise<Category | null>>
    ).mockResolvedValue(
      new Category({
        id: "other-id",
        name: "Updated Name",
        color: "#000000",
        icon: null,
        displayOrder: 1,
        isDefault: false,
        isOther: false,
        userId: userId,
      })
    );

    await expect(useCase.execute(categoryId, userId, input)).rejects.toThrow("Category with this name already exists");
    expect(mockCategoryRepository.findByName).toHaveBeenCalledWith(userId, input.name!);
    expect(mockCategoryRepository.update).not.toHaveBeenCalled();
  });
});

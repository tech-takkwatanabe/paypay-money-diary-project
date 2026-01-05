import { describe, it, expect, beforeEach, mock, Mock } from "bun:test";
import { ListCategoriesUseCase } from "./listCategoriesUseCase";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Category } from "@/domain/entity/category";
import { CreateCategoryInput, UpdateCategoryInput } from "@paypay-money-diary/shared";

describe("ListCategoriesUseCase", () => {
  let useCase: ListCategoriesUseCase;
  let mockCategoryRepository: ICategoryRepository;

  const userId = "user-1";
  const categories = [new Category("1", "Food", "#FF0000", "food", 0, false, null)];

  beforeEach(() => {
    mockCategoryRepository = {
      findById: mock(async (_id: string) => null),
      findByUserId: mock(async (_userId: string) => []),
      create: mock(async (_userId: string, _data: CreateCategoryInput) => ({}) as Category),
      update: mock(async (_id: string, _data: UpdateCategoryInput) => ({}) as Category),
      delete: mock(async (_id: string) => {}),
    };
    useCase = new ListCategoriesUseCase(mockCategoryRepository);
  });

  it("should return categories for the user", async () => {
    (mockCategoryRepository.findByUserId as Mock<(_userId: string) => Promise<Category[]>>).mockResolvedValue(
      categories
    );

    const result = await useCase.execute(userId);

    expect(result).toBe(categories);
    expect(mockCategoryRepository.findByUserId).toHaveBeenCalledWith(userId);
  });
});

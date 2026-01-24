import { describe, it, expect, beforeEach, mock, Mock } from "bun:test";
import { ListCategoriesUseCase } from "./listCategoriesUseCase";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Category } from "@/domain/entity/category";
import { CreateCategoryInput, InternalCreateCategoryInput, UpdateCategoryInput } from "@paypay-money-diary/shared";

describe("ListCategoriesUseCase", () => {
  let useCase: ListCategoriesUseCase;
  let mockCategoryRepository: ICategoryRepository;

  const userId = "user-1";
  const categories = [
    new Category({
      id: "1",
      name: "Food",
      color: "#FF0000",
      icon: "food",
      displayOrder: 0,
      isDefault: false,
      isOther: false,
      userId: userId,
    }),
  ];

  beforeEach(() => {
    mockCategoryRepository = {
      findById: mock(async (_id: string) => null),
      findByUserId: mock(async (_userId: string) => []),
      findByName: mock(async (_userId: string, _name: string) => null),
      create: mock(async (_userId: string, _data: CreateCategoryInput) => ({}) as Category),
      createInternal: mock(async (_userId: string, _data: InternalCreateCategoryInput) => ({}) as Category),
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

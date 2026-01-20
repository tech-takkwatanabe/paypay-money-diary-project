import { describe, it, expect, beforeEach, mock, Mock } from "bun:test";
import { CreateCategoryUseCase } from "./createCategoryUseCase";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Category } from "@/domain/entity/category";
import { CreateCategoryInput, UpdateCategoryInput } from "@paypay-money-diary/shared";

describe("CreateCategoryUseCase", () => {
  let useCase: CreateCategoryUseCase;
  let mockCategoryRepository: ICategoryRepository;

  const userId = "user-1";
  const input: CreateCategoryInput = {
    name: "New Category",
    color: "#FF0000",
    icon: "star",
    displayOrder: 10,
  };

  const createdCategory = new Category({
    id: "new-id",
    name: input.name,
    color: input.color,
    icon: input.icon ?? null,
    displayOrder: input.displayOrder ?? 0,
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
    useCase = new CreateCategoryUseCase(mockCategoryRepository);
  });

  it("should create a category successfully", async () => {
    (
      mockCategoryRepository.create as Mock<(_userId: string, _data: CreateCategoryInput) => Promise<Category>>
    ).mockResolvedValue(createdCategory);

    const result = await useCase.execute(userId, input);

    expect(result).toBe(createdCategory);
    expect(mockCategoryRepository.create).toHaveBeenCalledWith(userId, input);
  });

  it("should throw error when category name is duplicated", async () => {
    (
      mockCategoryRepository.create as Mock<(_userId: string, _data: CreateCategoryInput) => Promise<Category>>
    ).mockRejectedValue(new Error("unique constraint violation"));

    expect(useCase.execute(userId, input)).rejects.toThrow("Category with this name already exists");
  });
});

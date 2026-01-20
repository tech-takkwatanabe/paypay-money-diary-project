import { describe, it, expect, beforeEach, mock, type Mock } from "bun:test";
import { DeleteCategoryUseCase } from "./deleteCategoryUseCase";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { CategoryService } from "@/service/category/categoryService";
import { Category } from "@/domain/entity/category";
import { Rule } from "@/domain/entity/rule";
import { CreateCategoryInput, UpdateCategoryInput, CreateRuleInput, UpdateRuleInput } from "@paypay-money-diary/shared";

describe("DeleteCategoryUseCase", () => {
  let useCase: DeleteCategoryUseCase;
  let mockCategoryRepository: ICategoryRepository;
  let mockRuleRepository: IRuleRepository;
  let mockCategoryService: CategoryService;

  const userId = "user-1";
  const categoryId = "cat-1";
  const otherCategoryId = "other-cat-id";
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
  const otherCategory = new Category({
    id: otherCategoryId,
    name: "その他",
    color: "#CCCCCC",
    icon: "others",
    displayOrder: 9999,
    isDefault: false,
    isOther: true,
    userId: userId,
  });

  beforeEach(() => {
    mockCategoryRepository = {
      findById: mock(async (_id: string) => null),
      findByUserId: mock(async (_userId: string) => []),
      findByName: mock(async (_userId: string, _name: string) => otherCategory),
      create: mock(async (_userId: string, _data: CreateCategoryInput) => ({}) as Category),
      update: mock(async (_id: string, _data: UpdateCategoryInput) => ({}) as Category),
      delete: mock(async (_id: string) => {}),
    };
    mockRuleRepository = {
      findByUserId: mock(async (_userId: string) => []),
      findById: mock(async (_id: string) => null),
      findByCategoryId: mock(async (_categoryId: string, _userId: string) => []),
      create: mock(async (_userId: string, _data: CreateRuleInput) => ({}) as Rule),
      update: mock(async (_id: string, _data: UpdateRuleInput) => ({}) as Rule),
      delete: mock(async (_id: string) => {}),
    };
    mockCategoryService = new CategoryService(mockCategoryRepository);
    mockCategoryService.ensureUserCanDelete = mock(async (_id: string, _userId: string) => category);

    useCase = new DeleteCategoryUseCase(mockCategoryRepository, mockRuleRepository, mockCategoryService);
  });

  it("should delete a category successfully", async () => {
    await useCase.execute(categoryId, userId);

    expect(mockCategoryService.ensureUserCanDelete).toHaveBeenCalledWith(categoryId, userId);
    expect(mockRuleRepository.findByCategoryId).toHaveBeenCalledWith(categoryId, userId);
    expect(mockCategoryRepository.delete).toHaveBeenCalledWith(categoryId);
  });

  it("should throw error if category is linked to rules", async () => {
    (
      mockRuleRepository.findByCategoryId as unknown as Mock<(_categoryId: string, _userId: string) => Promise<Rule[]>>
    ).mockResolvedValue([{ id: "rule-1" } as Rule]);

    expect(useCase.execute(categoryId, userId)).rejects.toThrow(
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

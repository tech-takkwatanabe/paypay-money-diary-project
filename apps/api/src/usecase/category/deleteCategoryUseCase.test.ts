import { describe, it, expect, beforeEach, mock, type Mock } from "bun:test";
import { DeleteCategoryUseCase } from "./deleteCategoryUseCase";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { CategoryService } from "@/service/category/categoryService";
import { Category } from "@/domain/entity/category";
import { Rule } from "@/domain/entity/rule";
import { Transaction } from "@/domain/entity/transaction";
import { CreateCategoryInput, UpdateCategoryInput, CreateRuleInput, UpdateRuleInput } from "@paypay-money-diary/shared";

describe("DeleteCategoryUseCase", () => {
  let useCase: DeleteCategoryUseCase;
  let mockCategoryRepository: ICategoryRepository;
  let mockRuleRepository: IRuleRepository;
  let mockTransactionRepository: ITransactionRepository;
  let mockCategoryService: CategoryService;

  const userId = "user-1";
  const categoryId = "cat-1";
  const otherCategoryId = "other-cat-id";
  const category = new Category(categoryId, "Food", "#FF0000", "food", 0, false, userId);
  const otherCategory = new Category(otherCategoryId, "その他", "#CCCCCC", "others", 9999, false, userId);

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
    mockTransactionRepository = {
      findByUserId: mock(async () => []),
      countByUserId: mock(async () => 0),
      sumByUserId: mock(async () => 0),
      findById: mock(async () => null),
      create: mock(async () => ({}) as Transaction),
      update: mock(async () => ({}) as Transaction),
      delete: mock(async () => {}),
      getAvailableYears: mock(async () => []),
      reCategorizeByRules: mock(async () => 0),
      createMany: mock(async () => []),
      existsByExternalId: mock(async () => false),
      reCategorize: mock(async () => 0),
    };
    mockCategoryService = new CategoryService(mockCategoryRepository);
    mockCategoryService.ensureUserCanDelete = mock(async (_id: string, _userId: string) => category);

    useCase = new DeleteCategoryUseCase(
      mockCategoryRepository,
      mockRuleRepository,
      mockTransactionRepository,
      mockCategoryService
    );
  });

  it("should delete a category successfully after re-categorizing transactions", async () => {
    await useCase.execute(categoryId, userId);

    expect(mockCategoryService.ensureUserCanDelete).toHaveBeenCalledWith(categoryId, userId);
    expect(mockRuleRepository.findByCategoryId).toHaveBeenCalledWith(categoryId, userId);
    expect(mockCategoryRepository.findByName).toHaveBeenCalledWith(userId, "その他");
    expect(mockTransactionRepository.reCategorize).toHaveBeenCalledWith(userId, categoryId, otherCategoryId);
    expect(mockCategoryRepository.delete).toHaveBeenCalledWith(categoryId);
  });

  it("should throw error if category is linked to rules", async () => {
    (
      mockRuleRepository.findByCategoryId as Mock<(_categoryId: string, _userId: string) => Promise<Rule[]>>
    ).mockResolvedValue([{ id: "rule-1" } as Rule]);

    expect(useCase.execute(categoryId, userId)).rejects.toThrow(
      "Cannot delete category linked to rules. Please delete or update the rules first."
    );
    expect(mockCategoryRepository.delete).not.toHaveBeenCalled();
  });
});

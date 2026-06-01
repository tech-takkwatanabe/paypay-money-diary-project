import { describe, it, expect, beforeEach, mock } from "bun:test";
import { ReorderCategoriesUseCase } from "./reorderCategoriesUseCase";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { CategoryService } from "@/service/category/categoryService";
import { Category } from "@/domain/entity/category";

describe("ReorderCategoriesUseCase", () => {
  let useCase: ReorderCategoriesUseCase;
  let mockCategoryRepository: ICategoryRepository;
  let mockCategoryService: CategoryService;

  const userId = "user-1";
  const cat1 = new Category({
    id: "cat-1",
    name: "Food",
    color: "#FF0000",
    icon: "food",
    displayOrder: 1,
    isDefault: false,
    isOther: false,
    userId,
  });
  const cat2 = new Category({
    id: "cat-2",
    name: "Transport",
    color: "#0000FF",
    icon: "bus",
    displayOrder: 2,
    isDefault: false,
    isOther: false,
    userId,
  });
  const cat3 = new Category({
    id: "cat-3",
    name: "その他",
    color: "#CCCCCC",
    icon: "others",
    displayOrder: 9999,
    isDefault: false,
    isOther: true,
    userId,
  });

  beforeEach(() => {
    mockCategoryRepository = {
      findByUserId: mock(async () => [cat1, cat2, cat3]),
      findById: mock(async () => null),
      findByName: mock(async () => null),
      create: mock(async () => ({} as Category)),
      createInternal: mock(async () => ({} as Category)),
      update: mock(async () => ({} as Category)),
      delete: mock(async () => {}),
      reorder: mock(async () => {}),
    };

    mockCategoryService = new CategoryService(mockCategoryRepository);
    // 元の validateReorder ロジックをそのままテストしたいので、
    // ここではサービスをあえてモックせず、リポジトリのみをモックして通す
    // ただし、UseCaseの構造に合わせてServiceをDIする

    useCase = new ReorderCategoriesUseCase(mockCategoryRepository, mockCategoryService);
  });

  it("should successfully reorder categories when 'Others' is not included", async () => {
    await useCase.execute(userId, ["cat-2", "cat-1"]);
    expect(mockCategoryRepository.reorder).toHaveBeenCalledWith(userId, ["cat-2", "cat-1"]);
  });

  it("should throw error when 'Others' category is included in reorder request", async () => {
    await expect(useCase.execute(userId, ["cat-3", "cat-1", "cat-2"])).rejects.toThrow(
      /Cannot reorder 'Others' category/
    );
    expect(mockCategoryRepository.reorder).not.toHaveBeenCalled();
  });

  it("should throw error when reorder list does not include all reorderable categories", async () => {
    await expect(useCase.execute(userId, ["cat-1"])).rejects.toThrow(/Reorder list must include all categories except/);
    expect(mockCategoryRepository.reorder).not.toHaveBeenCalled();
  });

  it("should throw error for duplicate IDs", async () => {
    await expect(useCase.execute(userId, ["cat-1", "cat-1", "cat-2"])).rejects.toThrow(/Duplicate/);
    expect(mockCategoryRepository.reorder).not.toHaveBeenCalled();
  });

  it("should throw error for unauthorized category IDs", async () => {
    await expect(useCase.execute(userId, ["cat-1", "non-existent"])).rejects.toThrow(/Unauthorized or invalid/);
    expect(mockCategoryRepository.reorder).not.toHaveBeenCalled();
  });
});

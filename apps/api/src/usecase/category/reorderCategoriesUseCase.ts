import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { CategoryService } from "@/service/category/categoryService";

/**
 * Reorder Categories UseCase
 * カテゴリの表示順を一括更新
 */
export class ReorderCategoriesUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly categoryService: CategoryService
  ) {}

  /**
   * 実行
   * @param userId ユーザーID
   * @param categoryIds 並び替え後のカテゴリIDリスト
   */
  async execute(userId: string, categoryIds: string[]): Promise<void> {
    // 1. バリデーション（Service層に委譲）
    await this.categoryService.validateReorder(userId, categoryIds);

    // 2. 表示順を更新（Repository層に委譲）
    await this.categoryRepository.reorder(userId, categoryIds);
  }
}

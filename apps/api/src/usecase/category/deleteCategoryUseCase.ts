import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { CategoryService } from "@/service/category/categoryService";

/**
 * Delete Category UseCase
 * カテゴリを削除
 */
export class DeleteCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly categoryService: CategoryService
  ) {}

  /**
   * 実行
   * @param categoryId カテゴリID
   * @param userId ユーザーID
   */
  async execute(categoryId: string, userId: string): Promise<void> {
    // 権限と削除可能性のチェック
    await this.categoryService.ensureUserCanDelete(categoryId, userId);

    await this.categoryRepository.delete(categoryId);
  }
}

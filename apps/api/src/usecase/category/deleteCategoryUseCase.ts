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
    const category = await this.categoryService.ensureUserCanDelete(categoryId, userId);

    // Entityのメソッドを利用して削除可能か判定
    if (!category.canDelete()) {
      // 詳細なエラーメッセージを返すために個別判定
      if (category.hasRules) {
        throw new Error("Cannot delete category linked to rules. Please delete or update the rules first.");
      }
      if (category.hasTransactions) {
        throw new Error(
          "Cannot delete category with existing transactions. Please delete or re-categorize the transactions first."
        );
      }
      // その他判定（デフォルトカテゴリなど）
      throw new Error("This category cannot be deleted.");
    }

    // カテゴリを削除
    await this.categoryRepository.delete(categoryId);
  }
}

import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Category } from "@/domain/entity/category";
import { CategoryService } from "@/service/category/categoryService";
import { UpdateCategoryInput } from "@paypay-money-diary/shared";

/**
 * Update Category UseCase
 * カテゴリを更新
 */
export class UpdateCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly categoryService: CategoryService
  ) {}

  /**
   * 実行
   * @param categoryId カテゴリID
   * @param userId ユーザーID
   * @param input 更新データ
   */
  async execute(categoryId: string, userId: string, input: UpdateCategoryInput): Promise<Category> {
    // 権限と更新可能性のチェック
    await this.categoryService.ensureUserCanUpdate(categoryId, userId);

    try {
      return await this.categoryRepository.update(categoryId, input);
    } catch (error) {
      // Drizzle/Postgres の一意制約違反をハンドリング
      if (error instanceof Error && error.message.includes("unique")) {
        throw new Error("Category with this name already exists");
      }
      throw error;
    }
  }
}

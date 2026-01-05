import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Category } from "@/domain/entity/category";
import { CreateCategoryInput } from "@paypay-money-diary/shared";

/**
 * Create Category UseCase
 * 新しいカテゴリを作成
 */
export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  /**
   * 実行
   * @param userId ユーザーID
   * @param input 作成データ
   */
  async execute(userId: string, input: CreateCategoryInput): Promise<Category> {
    try {
      return await this.categoryRepository.create(userId, input);
    } catch (error) {
      // Drizzle/Postgres の一意制約違反をハンドリング
      if (error instanceof Error && error.message.includes("unique")) {
        throw new Error("Category with this name already exists");
      }
      throw error;
    }
  }
}

import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Category } from "@/domain/entity/category";

/**
 * List Categories UseCase
 * ユーザーが利用可能なカテゴリ一覧を取得
 */
export class ListCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  /**
   * 実行
   * @param userId ユーザーID
   */
  async execute(userId: string): Promise<Category[]> {
    return await this.categoryRepository.findByUserId(userId);
  }
}

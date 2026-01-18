import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { CategoryService } from "@/service/category/categoryService";

/**
 * Delete Category UseCase
 * カテゴリを削除
 */
export class DeleteCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly ruleRepository: IRuleRepository,
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryService: CategoryService
  ) {}

  /**
   * 実行
   * @param categoryId カテゴリID
   * @param userId ユーザーID
   */
  async execute(categoryId: string, userId: string): Promise<void> {
    // 権限と削除可能性のチェック
    const _category = await this.categoryService.ensureUserCanDelete(categoryId, userId);

    // 1. ルールに紐づいているか確認
    const rules = await this.ruleRepository.findByCategoryId(categoryId, userId);
    if (rules.length > 0) {
      throw new Error("Cannot delete category linked to rules. Please delete or update the rules first.");
    }

    // 2. 「その他」カテゴリを取得（移行先）
    const otherCategory = await this.categoryRepository.findByName(userId, "その他");
    if (!otherCategory) {
      throw new Error("'Other' category not found. Cannot migrate transactions.");
    }

    // 3. 取引のカテゴリを「その他」に更新
    await this.transactionRepository.reCategorize(userId, categoryId, otherCategory.id);

    // 4. カテゴリを削除
    await this.categoryRepository.delete(categoryId);
  }
}

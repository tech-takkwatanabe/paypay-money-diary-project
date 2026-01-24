import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { IDefaultCategoryRepository } from "@/domain/repository/defaultCategoryRepository";
import { IDefaultCategoryRuleRepository } from "@/domain/repository/defaultCategoryRuleRepository";
import { CreateCategoryInput, CreateRuleInput } from "@paypay-money-diary/shared";

/**
 * Category Initialization Service
 * 新規ユーザー向けにデフォルトカテゴリとルールをコピーして初期化する
 */
export class CategoryInitializationService {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly ruleRepository: IRuleRepository,
    private readonly defaultCategoryRepository: IDefaultCategoryRepository,
    private readonly defaultCategoryRuleRepository: IDefaultCategoryRuleRepository
  ) {}

  /**
   * ユーザーのカテゴリとルールを初期化
   * @param userId ユーザーのUUID
   * @throws Error カテゴリの取得または作成に失敗した場合
   */
  async initializeForUser(userId: string): Promise<void> {
    // 1. ユーザーが既にカテゴリを持っているか確認
    const existingCategories = await this.categoryRepository.findByUserId(userId);
    if (existingCategories.length > 0) {
      // 既に初期化済みなので何もしない
      return;
    }

    // 2. デフォルトカテゴリを取得
    const defaultCategories = await this.defaultCategoryRepository.findAll();

    // 3. ユーザー用カテゴリとしてコピー
    // デフォルトカテゴリIDから新しいIDへのマッピングを保持（ルールの紐付け用）
    const categoryIdMap = new Map<string, string>();

    for (const defaultCategory of defaultCategories) {
      const createInput: CreateCategoryInput = {
        name: defaultCategory.name,
        color: defaultCategory.color,
        icon: defaultCategory.icon,
        displayOrder: defaultCategory.displayOrder,
      };

      const createdCategory = await this.categoryRepository.create(userId, createInput);
      categoryIdMap.set(defaultCategory.id, createdCategory.id);
    }

    // 4. デフォルトルールを取得
    const defaultRules = await this.defaultCategoryRuleRepository.findAll();

    // 5. ユーザー用ルールとしてコピー
    for (const defaultRule of defaultRules) {
      const newCategoryId = categoryIdMap.get(defaultRule.defaultCategoryId);
      if (newCategoryId) {
        const createRuleInput: CreateRuleInput = {
          keyword: defaultRule.keyword,
          categoryId: newCategoryId,
          priority: defaultRule.priority,
        };

        await this.ruleRepository.create(userId, createRuleInput);
      }
    }
  }
}

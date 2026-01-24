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
   * ユーザーのカテゴリとルールを初期化（べき等）
   * @param userId ユーザーのUUID
   * @throws Error カテゴリの取得または作成に失敗した場合
   * 
   * 注: 部分初期化からの安全な再開を保証するため、べき等実装を採用
   * 既存カテゴリとデフォルトカテゴリを比較し、不足しているもののみを作成
   */
  async initializeForUser(userId: string): Promise<void> {
    // 1. ユーザーの既存カテゴリを取得
    const existingCategories = await this.categoryRepository.findByUserId(userId);

    // 2. デフォルトカテゴリを取得
    const defaultCategories = await this.defaultCategoryRepository.findAll();

    // 3. 既存カテゴリとデフォルトカテゴリのマッピングを構築
    // displayOrderでソートしたデフォルトカテゴリと既存カテゴリを照合
    const sortedDefaults = [...defaultCategories].sort((a, b) => a.displayOrder - b.displayOrder);
    const sortedExisting = [...existingCategories].sort((a, b) => a.displayOrder - b.displayOrder);

    // 既存カテゴリが完全に揃っているか確認
    const hasAllCategories =
      sortedExisting.length === sortedDefaults.length &&
      sortedExisting.every((existing, index) => {
        const defaultCat = sortedDefaults[index];
        return (
          existing.name === defaultCat.name &&
          existing.color === defaultCat.color &&
          existing.displayOrder === defaultCat.displayOrder &&
          existing.isOther === defaultCat.isOther
        );
      });

    if (hasAllCategories) {
      // すべてのカテゴリが揃っているので、ルールの確認に進む
      return this.ensureRulesExist(userId);
    }

    // 4. 不足しているカテゴリのマッピングを作成
    const categoryIdMap = new Map<string, string>();

    for (const defaultCategory of sortedDefaults) {
      // 同じ名前と色のカテゴリが既に存在するか確認
      const existingCategory = sortedExisting.find(
        (cat) => cat.name === defaultCategory.name && cat.color === defaultCategory.color
      );

      if (existingCategory) {
        // 既に存在する場合はIDをマッピング
        categoryIdMap.set(defaultCategory.id, existingCategory.id);
      } else {
        // 存在しない場合は作成
        const createInput: CreateCategoryInput = {
          name: defaultCategory.name,
          color: defaultCategory.color,
          icon: defaultCategory.icon,
          displayOrder: defaultCategory.displayOrder,
        };

        const createdCategory = await this.categoryRepository.create(userId, createInput);
        categoryIdMap.set(defaultCategory.id, createdCategory.id);
      }
    }

    // 5. ルールを確認・作成
    await this.ensureRulesExist(userId, categoryIdMap);
  }

  /**
   * ルールが揃っているか確認し、不足しているものを作成
   * @param userId ユーザーのUUID
   * @param categoryIdMap デフォルトカテゴリIDから新しいIDへのマッピング（オプション）
   */
  private async ensureRulesExist(
    userId: string,
    categoryIdMap?: Map<string, string>
  ): Promise<void> {
    // デフォルトルールを取得
    const defaultRules = await this.defaultCategoryRuleRepository.findAll();

    // マッピングが提供されていない場合は、既存カテゴリから構築
    let mapping = categoryIdMap;
    if (!mapping) {
      mapping = await this.buildCategoryIdMap(userId);
    }

    // ルールを作成（既存するかどうかはリポジトリ層で処理）
    for (const defaultRule of defaultRules) {
      const newCategoryId = mapping.get(defaultRule.defaultCategoryId);
      if (newCategoryId) {
        const createRuleInput: CreateRuleInput = {
          keyword: defaultRule.keyword,
          categoryId: newCategoryId,
          priority: defaultRule.priority,
        };

        try {
          await this.ruleRepository.create(userId, createRuleInput);
        } catch (error) {
          // ルールが既に存在する場合（unique constraint）はスキップ
          if ((error as Error).message.includes("unique")) {
            continue;
          }
          throw error;
        }
      } else {
        console.warn(
          `[CategoryInitializationService] Skipping rule "${defaultRule.keyword}": default category ID "${defaultRule.defaultCategoryId}" not found in mapping`
        );
      }
    }
  }

  /**
   * デフォルトカテゴリIDから新しいカテゴリIDへのマッピングを構築
   * @param userId ユーザーのUUID
   * @returns マッピング
   */
  private async buildCategoryIdMap(userId: string): Promise<Map<string, string>> {
    const mapping = new Map<string, string>();
    const existingCategories = await this.categoryRepository.findByUserId(userId);
    const defaultCategories = await this.defaultCategoryRepository.findAll();

    for (const defaultCategory of defaultCategories) {
      // displayOrderと名前で既存カテゴリを特定
      const existingCategory = existingCategories.find(
        (cat) => cat.displayOrder === defaultCategory.displayOrder && cat.name === defaultCategory.name
      );

      if (existingCategory) {
        mapping.set(defaultCategory.id, existingCategory.id);
      }
    }

    return mapping;
  }
}
